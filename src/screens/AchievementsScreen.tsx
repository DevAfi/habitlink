import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { achievementService } from '../services/achievementService';
import { Achievement, UserAchievement, UserStats } from '../types/types';
import AchievementCard from '../components/AchievementCard';
import AchievementDebugger from '../components/AchievementDebugger';

const AchievementsScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'earned' | 'available'>('earned');
  const [earnedAchievements, setEarnedAchievements] = useState<UserAchievement[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    fetchData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchData = async () => {
    if (!user) {
      console.log('❌ No user found, skipping achievement fetch');
      return;
    }

    console.log('📊 Fetching achievement data for user:', user.id);
    setLoading(true);
    
    try {
      const [earned, available, stats] = await Promise.all([
        achievementService.getUserAchievements(user.id),
        achievementService.getAvailableAchievements(user.id),
        achievementService.getUserStats(user.id)
      ]);

      console.log('📊 Achievement data fetched:');
      console.log('- Earned achievements:', earned.length);
      console.log('- Available achievements:', available.length);
      console.log('- User stats:', stats ? 'Found' : 'Not found');

      setEarnedAchievements(earned);
      setAvailableAchievements(available);
      setUserStats(stats);
    } catch (error) {
      console.error('❌ Error fetching achievements:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getLevelProgress = () => {
    if (!userStats) return { current: 0, next: 100, percentage: 0 };
    
    const currentLevelXP = (userStats.level - 1) * 100;
    const nextLevelXP = userStats.level * 100;
    const progressXP = userStats.experience_points - currentLevelXP;
    const requiredXP = nextLevelXP - currentLevelXP;
    
    return {
      current: progressXP,
      next: requiredXP,
      percentage: Math.min(100, (progressXP / requiredXP) * 100)
    };
  };

  const levelProgress = getLevelProgress();

  const renderStatsCard = () => (
    <Animated.View 
      style={[
        styles.statsCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={theme.gradients.purple as [string, string, ...string[]]}
        style={styles.statsGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {userStats?.level || 1}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats?.total_points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats?.achievements_count || 0}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats?.longest_streak || 0}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>

        <View style={styles.levelProgressContainer}>
          <Text style={styles.levelProgressText}>
            {levelProgress.current}/{levelProgress.next} XP to Level {(userStats?.level || 1) + 1}
          </Text>
          <View style={styles.levelProgressBar}>
            <View 
              style={[
                styles.levelProgressFill,
                { width: `${levelProgress.percentage}%` }
              ]} 
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'earned' && styles.activeTab
        ]}
        onPress={() => setActiveTab('earned')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'earned' && styles.activeTabText
        ]}>
          Earned ({earnedAchievements.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'available' && styles.activeTab
        ]}
        onPress={() => setActiveTab('available')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'available' && styles.activeTabText
        ]}>
          Available ({availableAchievements.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAchievementsList = () => {
    const achievements = activeTab === 'earned' 
      ? earnedAchievements.map(ua => ({ ...ua.achievement, achievedAt: ua.achieved_at }))
      : availableAchievements;

    if (achievements.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            {activeTab === 'earned' ? '🏆' : '🎯'}
          </Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'earned' ? 'No achievements yet' : 'No available achievements'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'earned' 
              ? 'Complete habits to start earning achievements!' 
              : 'Keep completing habits to unlock more achievements'
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.achievementsList}>
        {achievements.map((achievement, index) => (
          <Animated.View
            key={achievement.id}
            style={{
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 20 + index * 10],
                }),
              }],
            }}
          >
            <AchievementCard
              achievement={achievement}
              isAchieved={activeTab === 'earned'}
              achievedAt={activeTab === 'earned' ? (achievement as any).achievedAt : undefined}
            />
          </Animated.View>
        ))}
      </View>
    );
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
        {renderStatsCard()}
        <AchievementDebugger />
        {renderTabBar()}
        {renderAchievementsList()}
      </ScrollView>
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
  statsCard: {
    margin: theme.spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  statsGradient: {
    padding: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textOnPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  levelProgressContainer: {
    marginTop: 8,
  },
  levelProgressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  levelProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.textOnPrimary,
    borderRadius: 3,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.textOnPrimary,
  },
  achievementsList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AchievementsScreen;
