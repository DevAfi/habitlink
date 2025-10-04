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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import AddHabitModal from './AddHabitModal';
import HabitCard from '../../components/HabitCard';

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

  useEffect(() => {
    fetchHabits();
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
      console.error('Error fetching habits:', error);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchHabits();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning! 👋</Text>
            <Text style={styles.subtitle}>Let's build some great habits today</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>🚪</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first habit to start tracking your progress
              </Text>
            </View>
          ) : (
            <View style={styles.habitsList}>
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  completedToday={habit.completedToday}
                  currentStreak={habit.currentStreak}
                  onToggle={() => toggleHabit(habit.id, habit.completedToday)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.gradients.purple}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

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
  debugButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  debugButtonText: {
    fontSize: 20,
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    boxShadow: '0px 8px 24px rgba(107, 92, 231, 0.4)',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: theme.colors.textOnPrimary,
    fontWeight: '300',
    lineHeight: 32,
  },
});

export default HomeScreen;