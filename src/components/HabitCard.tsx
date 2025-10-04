import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { supabase } from '../services/supabaseClient';

interface HabitCardProps {
  habit: {
    id: string;
    title: string;
    description: string | null;
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

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.habitInfo}>
          <Text style={styles.habitTitle}>{habit.title}</Text>
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
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
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