// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

interface Habit {
  id: string;
  title: string;
  description: string;
  streak: number;
  target: number;
  completed: number;
  color: string;
  icon: string;
}

const HomeScreen = () => {
  const [habits] = useState<Habit[]>([
    {
      id: '1',
      title: 'Morning Workout',
      description: '30 minutes of exercise',
      streak: 7,
      target: 30,
      completed: 25,
      color: theme.colors.success,
      icon: '💪',
    },
    {
      id: '2',
      title: 'Read Books',
      description: 'Read for 20 minutes daily',
      streak: 12,
      target: 20,
      completed: 18,
      color: theme.colors.info,
      icon: '📚',
    },
    {
      id: '3',
      title: 'Meditation',
      description: '10 minutes of mindfulness',
      streak: 5,
      target: 10,
      completed: 8,
      color: theme.colors.primary,
      icon: '🧘',
    },
  ]);
  
  const [scaleValue] = useState(new Animated.Value(1));
  
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getProgressPercentage = (completed: number, target: number) => {
    return Math.min((completed / target) * 100, 100);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return theme.colors.success;
    if (streak >= 3) return theme.colors.warning;
    return theme.colors.textLight;
  };

  const HabitCard = ({ habit }: { habit: Habit }) => {
    const progress = getProgressPercentage(habit.completed, habit.target);
    const [cardScale] = useState(new Animated.Value(1));
    
    const handleCardPressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };
    
    const handleCardPressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };
    
    return (
      <Animated.View style={{ transform: [{ scale: cardScale }] }}>
        <TouchableOpacity 
          style={styles.habitCard} 
          activeOpacity={0.8}
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
        >
        <View style={styles.habitHeader}>
          <View style={styles.habitIconContainer}>
            <Text style={styles.habitIcon}>{habit.icon}</Text>
          </View>
          <View style={styles.habitInfo}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <Text style={styles.habitDescription}>{habit.description}</Text>
          </View>
          <View style={styles.streakContainer}>
            <Text style={[styles.streakNumber, { color: getStreakColor(habit.streak) }]}>
              {habit.streak}
            </Text>
            <Text style={styles.streakLabel}>days</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress}%`,
                  backgroundColor: habit.color,
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {habit.completed}/{habit.target} min
          </Text>
        </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const StatsCard = () => (
    <View style={styles.statsCard}>
      <LinearGradient
        colors={theme.gradients.primary}
        style={styles.statsGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.statsTitle}>Today's Progress</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning! 👋</Text>
        <Text style={styles.subtitle}>Let's build some great habits today</Text>
      </View>

      <StatsCard />

      <View style={styles.habitsSection}>
        <Text style={styles.sectionTitle}>Your Habits</Text>
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </View>

      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity 
          style={styles.addButton} 
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.addButtonText}>+ Add New Habit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
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
  statsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  statsGradient: {
    padding: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnPrimary,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textOnPrimary,
    opacity: 0.9,
  },
  habitsSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  habitCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  habitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  habitIcon: {
    fontSize: 24,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  habitDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  streakLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  addButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  addButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnPrimary,
  },
});

export default HomeScreen;