// src/screens/habit/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import AddHabitModal from './AddHabitModal';
import HabitCard from '../../components/HabitCard';

const { width, height } = Dimensions.get('window');

interface Habit {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface HabitWithStats extends Habit {
  completedToday: boolean;
  currentStreak: number;
}

const HomeScreen = () => {
  const { signOut, user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const fabScale = useState(new Animated.Value(0))[0];
  const glowAnim = useState(new Animated.Value(0))[0];
  const statsSlideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    fetchHabits();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(statsSlideAnim, {
        toValue: 0,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();

    return () => glowAnimation.stop();
  }, []);

  const fetchHabits = async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch habits
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (habitsError) {
      console.error('Error fetching habits:', habitsError);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Fetch today's completions
    const today = new Date().toISOString().split('T')[0];
    const { data: completionsData } = await supabase
      .from('completions')
      .select('habit_id, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', today)
      .lte('completed_at', today);

    // Calculate streaks for each habit
    const habitsWithStats = await Promise.all(
      (habitsData || []).map(async (habit) => {
        const completedToday = completionsData?.some(c => c.habit_id === habit.id) || false;
        const streak = await calculateStreak(habit.id);
        
        return {
          ...habit,
          completedToday,
          currentStreak: streak,
        };
      })
    );

    setHabits(habitsWithStats);
    setLoading(false);
    setRefreshing(false);
  };

  const calculateStreak = async (habitId: string): Promise<number> => {
    const { data } = await supabase
      .from('completions')
      .select('completed_at')
      .eq('habit_id', habitId)
      .order('completed_at', { ascending: false })
      .limit(100);

    if (!data || data.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < data.length; i++) {
      const completionDate = new Date(data[i].completed_at);
      completionDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (completionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const toggleHabit = async (habitId: string, currentlyCompleted: boolean) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    if (currentlyCompleted) {
      // Remove completion
      const { error } = await supabase
        .from('completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('completed_at', today);

      if (error) {
        Alert.alert('Error', 'Failed to update habit');
        console.error('Error removing completion:', error);
        return;
      }
    } else {
      // Add completion
      const { error } = await supabase
        .from('completions')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_at: today,
        });

      if (error) {
        Alert.alert('Error', 'Failed to update habit');
        console.error('Error adding completion:', error);
        return;
      }
    }

    fetchHabits();
  };

  const deleteHabit = async (habitId: string, habitTitle: string) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habitTitle}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('habits')
              .delete()
              .eq('id', habitId);

            if (error) {
              Alert.alert('Error', 'Failed to delete habit');
              console.error('Error deleting habit:', error);
              return;
            }

            // Also delete related completions
            await supabase
              .from('completions')
              .delete()
              .eq('habit_id', habitId);

            fetchHabits();
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHabits();
  };

  // Calculate daily stats
  const completedToday = habits.filter(habit => habit.completedToday).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Animated background glow */}
      <Animated.View 
        style={[
          styles.backgroundGlow,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.6],
            }),
          },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Good morning! 👋</Text>
            <Text style={styles.subtitle}>Let's build some great habits today</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>🚪</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Daily Stats Section */}
        {totalHabits > 0 && (
          <Animated.View 
            style={[
              styles.statsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: statsSlideAnim }],
              },
            ]}
          >
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedToday}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalHabits}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{Math.round(completionRate)}%</Text>
                <Text style={styles.statLabel}>Progress</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first habit to start tracking your progress ✨
              </Text>
            </View>
          ) : (
            <View style={styles.habitsList}>
              {habits.map((habit, index) => (
                <Animated.View
                  key={habit.id}
                  style={[
                    styles.habitCardWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 30],
                            outputRange: [0, 20 + index * 10],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <HabitCard
                    habit={habit}
                    completedToday={habit.completedToday}
                    currentStreak={habit.currentStreak}
                    onToggle={() => toggleHabit(habit.id, habit.completedToday)}
                    onDelete={() => deleteHabit(habit.id, habit.title)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Animated Floating Add Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
          style={styles.fabTouchable}
        >
          <LinearGradient
            colors={theme.gradients.purple as [string, string, ...string[]]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
          <View style={styles.fabGlow} />
        </TouchableOpacity>
      </Animated.View>

      <AddHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onHabitAdded={fetchHabits}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backgroundGlow: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    borderRadius: (width * 1.5) / 2,
    backgroundColor: theme.colors.primary,
    top: -height * 0.25,
    left: -width * 0.25,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textLight,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutText: {
    fontSize: 20,
  },
  statsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  habitsList: {
    gap: 0,
  },
  habitCardWrapper: {
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
  fabTouchable: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: 'relative',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  fabGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    opacity: 0.2,
    top: -8,
    left: -8,
  },
  fabIcon: {
    fontSize: 32,
    color: theme.colors.textOnPrimary,
    fontWeight: '300',
    lineHeight: 32,
  },
});

export default HomeScreen;