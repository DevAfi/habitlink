// src/screens/FeedScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

interface Activity {
  id: string;
  user: {
    name: string;
    avatar: string;
    username: string;
  };
  action: string;
  habit: string;
  time: string;
  streak?: number;
  likes: number;
  liked: boolean;
  type: 'completion' | 'streak' | 'achievement';
}

const FeedScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      user: {
        name: 'Alex Johnson',
        avatar: 'AJ',
        username: 'alexj',
      },
      action: 'completed',
      habit: 'Morning Workout',
      time: '2 hours ago',
      streak: 7,
      likes: 12,
      liked: false,
      type: 'completion',
    },
    {
      id: '2',
      user: {
        name: 'Sarah Chen',
        avatar: 'SC',
        username: 'sarahc',
      },
      action: 'achieved',
      habit: '30-day streak',
      time: '4 hours ago',
      streak: 30,
      likes: 24,
      liked: true,
      type: 'achievement',
    },
    {
      id: '3',
      user: {
        name: 'Mike Rodriguez',
        avatar: 'MR',
        username: 'miker',
      },
      action: 'completed',
      habit: 'Read Books',
      time: '6 hours ago',
      streak: 15,
      likes: 8,
      liked: false,
      type: 'completion',
    },
    {
      id: '4',
      user: {
        name: 'Emma Wilson',
        avatar: 'EW',
        username: 'emmaw',
      },
      action: 'completed',
      habit: 'Meditation',
      time: '8 hours ago',
      streak: 3,
      likes: 5,
      liked: false,
      type: 'completion',
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return '✅';
      case 'streak':
        return '🔥';
      case 'achievement':
        return '🏆';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completion':
        return theme.colors.success;
      case 'streak':
        return theme.colors.warning;
      case 'achievement':
        return theme.colors.primary;
      default:
        return theme.colors.textLight;
    }
  };

  const ActivityCard = ({ activity }: { activity: Activity }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>{activity.user.avatar}</Text>
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.userName}>{activity.user.name}</Text>
          <Text style={styles.activityText}>
            {activity.action} <Text style={styles.habitName}>{activity.habit}</Text>
          </Text>
          <Text style={styles.timeText}>{activity.time}</Text>
        </View>
        <View style={styles.activityIcon}>
          <Text style={styles.iconText}>{getActivityIcon(activity.type)}</Text>
        </View>
      </View>

      {activity.streak && (
        <View style={styles.streakContainer}>
          <LinearGradient
            colors={[getActivityColor(activity.type), `${getActivityColor(activity.type)}80`]}
            style={styles.streakGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.streakText}>
              🔥 {activity.streak} day streak!
            </Text>
          </LinearGradient>
        </View>
      )}

      <View style={styles.activityFooter}>
        <TouchableOpacity style={styles.likeButton} activeOpacity={0.7}>
          <Text style={[
            styles.likeIcon,
            activity.liked && styles.likeIconActive
          ]}>
            {activity.liked ? '❤️' : '🤍'}
          </Text>
          <Text style={[
            styles.likeText,
            activity.liked && styles.likeTextActive
          ]}>
            {activity.likes}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.commentButton} activeOpacity={0.7}>
          <Text style={styles.commentIcon}>💬</Text>
          <Text style={styles.commentText}>Comment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const QuickStats = () => (
    <View style={styles.quickStats}>
      <LinearGradient
        colors={theme.gradients.primary}
        style={styles.quickStatsGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.quickStatsContent}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>24</Text>
            <Text style={styles.quickStatLabel}>Activities Today</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>156</Text>
            <Text style={styles.quickStatLabel}>Total This Week</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Activity Feed</Text>
        <Text style={styles.subtitle}>See what your friends are up to</Text>
      </View>

      <QuickStats />

      <View style={styles.activitiesSection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </View>

      <TouchableOpacity style={styles.loadMoreButton} activeOpacity={0.8}>
        <Text style={styles.loadMoreText}>Load More Activities</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textLight,
  },
  quickStats: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  quickStatsGradient: {
    padding: theme.spacing.lg,
  },
  quickStatsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatNumber: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
    marginBottom: theme.spacing.xs,
  },
  quickStatLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textOnPrimary,
    opacity: 0.9,
    textAlign: 'center',
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: theme.spacing.md,
  },
  activitiesSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
  activityInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  activityText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  habitName: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  timeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  streakContainer: {
    marginBottom: theme.spacing.md,
  },
  streakGradient: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  streakText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnPrimary,
    textAlign: 'center',
  },
  activityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  likeIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  likeIconActive: {
    // Already styled by emoji
  },
  likeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  likeTextActive: {
    color: theme.colors.error,
    fontWeight: theme.fontWeight.semibold,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  commentText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  loadMoreButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default FeedScreen;