import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { Achievement } from '../types/types';

interface AchievementCardProps {
  achievement: Achievement;
  isAchieved?: boolean;
  achievedAt?: string;
  progress?: {
    progress: number;
    total: number;
    percentage: number;
  };
  onPress?: () => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  isAchieved = false,
  achievedAt,
  progress,
  onPress
}) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return ['#6b7280', '#9ca3af'];
      case 'uncommon': return ['#10b981', '#34d399'];
      case 'rare': return ['#3b82f6', '#60a5fa'];
      case 'epic': return ['#8b5cf6', '#a78bfa'];
      case 'legendary': return ['#f59e0b', '#fbbf24'];
      default: return ['#6b7280', '#9ca3af'];
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Common';
      case 'uncommon': return 'Uncommon';
      case 'rare': return 'Rare';
      case 'epic': return 'Epic';
      case 'legendary': return 'Legendary';
      default: return 'Common';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isAchieved && styles.achievedCard
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isAchieved ? getRarityColor(achievement.rarity) : [theme.colors.surface, theme.colors.backgroundLight]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{achievement.icon}</Text>
            {isAchieved && (
              <View style={styles.achievedBadge}>
                <Text style={styles.achievedText}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={[
              styles.title,
              !isAchieved && styles.lockedTitle
            ]}>
              {achievement.title}
            </Text>
            
            <Text style={[
              styles.description,
              !isAchieved && styles.lockedDescription
            ]}>
              {achievement.description}
            </Text>

            <View style={styles.metaContainer}>
              <View style={styles.rarityContainer}>
                <Text style={[
                  styles.rarityText,
                  { color: getRarityColor(achievement.rarity)[1] }
                ]}>
                  {getRarityText(achievement.rarity)}
                </Text>
                <Text style={styles.pointsText}>
                  {achievement.points} pts
                </Text>
              </View>

              {achievedAt && (
                <Text style={styles.achievedDate}>
                  {new Date(achievedAt).toLocaleDateString()}
                </Text>
              )}
            </View>

            {!isAchieved && progress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${progress.percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {progress.progress}/{progress.total} ({progress.percentage}%)
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  achievedCard: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  icon: {
    fontSize: 24,
  },
  achievedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  achievedText: {
    fontSize: 12,
    color: theme.colors.textOnPrimary,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  lockedTitle: {
    color: theme.colors.textLight,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
    marginBottom: 8,
  },
  lockedDescription: {
    color: theme.colors.textSecondary,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
    textTransform: 'uppercase',
  },
  pointsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  achievedDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
});

export default AchievementCard;
