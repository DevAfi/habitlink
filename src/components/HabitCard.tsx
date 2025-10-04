import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { supabase } from '../services/supabaseClient';

// Habit categories with icons and colors (same as AddHabitModal)
const HABIT_CATEGORIES = [
  { id: 'health', name: 'Health & Fitness', icon: '💪', colors: ['#FF6B6B', '#FF8E8E'] },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', colors: ['#4ECDC4', '#45B7B8'] },
  { id: 'productivity', name: 'Productivity', icon: '⚡', colors: ['#FFD93D', '#FFA726'] },
  { id: 'learning', name: 'Learning', icon: '📚', colors: ['#9B59B6', '#8E44AD'] },
  { id: 'social', name: 'Social', icon: '👥', colors: ['#3498DB', '#2980B9'] },
  { id: 'creative', name: 'Creative', icon: '🎨', colors: ['#E91E63', '#C2185B'] },
  { id: 'personal', name: 'Personal Care', icon: '✨', colors: ['#FF9800', '#F57C00'] },
  { id: 'finance', name: 'Finance', icon: '💰', colors: ['#4CAF50', '#388E3C'] },
  { id: 'home', name: 'Home & Organization', icon: '🏠', colors: ['#795548', '#5D4037'] },
  { id: 'other', name: 'Other', icon: '🌟', colors: ['#607D8B', '#455A64'] },
];

interface HabitCardProps {
  habit: {
    id: string;
    title: string;
    description: string | null;
    category?: string;
  };
  completedToday: boolean;
  currentStreak: number;
  onToggle: () => void;
  onDelete: () => void;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  completedToday,
  currentStreak,
  onToggle,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    await onToggle();
    setLoading(false);
  };

  // Get category info
  const categoryInfo = HABIT_CATEGORIES.find(cat => cat.id === habit.category) || HABIT_CATEGORIES.find(cat => cat.id === 'other')!;

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.habitInfo}>
          <View style={styles.habitHeader}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <View style={styles.categoryBadge}>
              <LinearGradient
                colors={categoryInfo.colors as [string, string, ...string[]]}
                style={styles.categoryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                <Text style={styles.categoryName}>{categoryInfo.name}</Text>
              </LinearGradient>
            </View>
          </View>
          {habit.description && (
            <Text style={styles.habitDescription}>{habit.description}</Text>
          )}
          {currentStreak > 0 && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{currentStreak} day streak</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.checkButton}
            onPress={handleToggle}
            disabled={loading}
            activeOpacity={0.8}
          >
            {completedToday ? (
              <LinearGradient
                colors={theme.gradients.purple as [string, string, ...string[]]}
                style={styles.checkButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.checkIcon}>✓</Text>
              </LinearGradient>
            ) : (
              <View style={styles.checkButtonEmpty}>
                <View style={styles.checkButtonInner} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
    marginRight: 16,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  categoryGradient: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textOnPrimary,
  },
  habitDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deleteIcon: {
    fontSize: 16,
  },
  checkButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  checkButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 16px rgba(107, 92, 231, 0.3)',
  },
  checkIcon: {
    fontSize: 28,
    color: theme.colors.textOnPrimary,
    fontWeight: '600',
  },
  checkButtonEmpty: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
});

export default HabitCard;