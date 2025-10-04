// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../utils/theme";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabaseClient";

const { width, height } = Dimensions.get('window');

interface AnalyticsData {
  totalHabits: number;
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  averageDailyCompletion: number;
  weeklyProgress: number[];
  monthlyProgress: number[];
  habitCategories: { [key: string]: number };
  bestPerformingHabit: string;
  improvementRate: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const glowAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchAnalytics();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();

    return () => glowAnimation.stop();
  }, []);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch all habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (habitsError) throw habitsError;

      // Fetch all completions
      const { data: completions, error: completionsError } = await supabase
        .from('completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (completionsError) throw completionsError;

      // Calculate analytics
      const analyticsData = calculateAnalytics(habits || [], completions || []);
      setAnalytics(analyticsData);
      
      // Generate achievements
      const userAchievements = generateAchievements(analyticsData);
      setAchievements(userAchievements);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateAnalytics = (habits: any[], completions: any[]): AnalyticsData => {
    const totalHabits = habits.length;
    const totalCompletions = completions.length;
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayCompletions = completions.filter(c => 
        c.completed_at.startsWith(dateStr)
      );
      
      if (dayCompletions.length > 0) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedCompletions = [...completions].sort((a, b) => 
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );

    if (sortedCompletions.length > 0) {
      let lastDate = new Date(sortedCompletions[0].completed_at);
      lastDate.setHours(0, 0, 0, 0);

      for (const completion of sortedCompletions) {
        const completionDate = new Date(completion.completed_at);
        completionDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((completionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          // Same day, continue streak
          continue;
        } else if (diffDays === 1) {
          // Next day, increment streak
          tempStreak++;
        } else {
          // Gap in days, reset streak
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
        
        lastDate = completionDate;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Calculate average daily completion
    const daysActive = Math.max(1, Math.ceil((Date.now() - new Date(habits[0]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
    const averageDailyCompletion = totalCompletions / daysActive;

    // Calculate weekly progress (last 7 days)
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayCompletions = completions.filter(c => c.completed_at.startsWith(dateStr)).length;
      weeklyProgress.push(dayCompletions);
    }

    // Calculate monthly progress (last 30 days)
    const monthlyProgress = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayCompletions = completions.filter(c => c.completed_at.startsWith(dateStr)).length;
      monthlyProgress.push(dayCompletions);
    }

    // Find best performing habit
    const habitCompletionCounts: { [key: string]: number } = {};
    completions.forEach(completion => {
      const habit = habits.find(h => h.id === completion.habit_id);
      if (habit) {
        habitCompletionCounts[habit.title] = (habitCompletionCounts[habit.title] || 0) + 1;
      }
    });

    const bestPerformingHabit = Object.keys(habitCompletionCounts).reduce((a, b) => 
      habitCompletionCounts[a] > habitCompletionCounts[b] ? a : b, 'None'
    );

    // Calculate improvement rate (completions this week vs last week)
    const thisWeek = weeklyProgress.slice(0, 7).reduce((a, b) => a + b, 0);
    const lastWeek = completions.filter(c => {
      const date = new Date(c.completed_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 14);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 21);
      return date >= twoWeeksAgo && date < weekAgo;
    }).length;
    
    const improvementRate = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    return {
      totalHabits,
      totalCompletions,
      currentStreak,
      longestStreak,
      averageDailyCompletion,
      weeklyProgress,
      monthlyProgress,
      habitCategories: {},
      bestPerformingHabit,
      improvementRate,
    };
  };

  const generateAchievements = (data: AnalyticsData): Achievement[] => {
    const achievements: Achievement[] = [
      {
        id: 'first_habit',
        title: 'Getting Started',
        description: 'Created your first habit',
        icon: '🎯',
        unlocked: data.totalHabits >= 1,
      },
      {
        id: 'first_completion',
        title: 'First Success',
        description: 'Completed your first habit',
        icon: '✅',
        unlocked: data.totalCompletions >= 1,
      },
      {
        id: 'streak_7',
        title: 'Week Warrior',
        description: '7 day streak',
        icon: '🔥',
        unlocked: data.currentStreak >= 7,
      },
      {
        id: 'streak_30',
        title: 'Monthly Master',
        description: '30 day streak',
        icon: '🏆',
        unlocked: data.currentStreak >= 30,
      },
      {
        id: 'habit_master',
        title: 'Habit Master',
        description: 'Created 10 habits',
        icon: '🎖️',
        unlocked: data.totalHabits >= 10,
      },
      {
        id: 'completion_100',
        title: 'Century Club',
        description: '100 total completions',
        icon: '💯',
        unlocked: data.totalCompletions >= 100,
      },
    ];

    return achievements;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleExportData = () => {
    if (!analytics) return;
    
    const data = {
      user: user?.username,
      exportDate: new Date().toISOString(),
      analytics,
      achievements,
    };

    // In a real app, you'd implement actual data export
    Alert.alert(
      'Export Data',
      'Data export feature would be implemented here. This could export to CSV, JSON, or integrate with analytics platforms.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics... 📊</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated background glow */}
      <Animated.View 
        style={[
          styles.backgroundGlow,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.4],
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
        {/* Profile Header */}
        <Animated.View 
          style={[
            styles.profileHeader,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || '👤'}
                </Text>
              </View>
              <View style={styles.avatarGlow} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user?.username || 'User'}</Text>
              <Text style={styles.fullName}>{user?.full_name || 'Habit Tracker'}</Text>
              <Text style={styles.memberSince}>
                Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>🚪</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Key Metrics */}
        {analytics && (
          <Animated.View 
            style={[
              styles.metricsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>📊 Key Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analytics.totalHabits}</Text>
                <Text style={styles.metricLabel}>Total Habits</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analytics.totalCompletions}</Text>
                <Text style={styles.metricLabel}>Completions</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analytics.currentStreak}</Text>
                <Text style={styles.metricLabel}>Current Streak</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{analytics.longestStreak}</Text>
                <Text style={styles.metricLabel}>Best Streak</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Weekly Progress Chart */}
        {analytics && (
          <Animated.View 
            style={[
              styles.chartContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>📈 Weekly Progress</Text>
            <View style={styles.chartCard}>
              <View style={styles.chart}>
                {analytics.weeklyProgress.map((value, index) => (
                  <View key={index} style={styles.chartBarContainer}>
                    <View 
                      style={[
                        styles.chartBar,
                        {
                          height: Math.max(20, (value / Math.max(...analytics.weeklyProgress, 1)) * 100),
                          backgroundColor: value > 0 ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    />
                    <Text style={styles.chartBarLabel}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}
                    </Text>
                    <Text style={styles.chartBarValue}>{value}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.chartDescription}>
                Daily completions over the last 7 days
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Insights */}
        {analytics && (
          <Animated.View 
            style={[
              styles.insightsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>💡 Insights</Text>
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>🏆</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Best Performer</Text>
                  <Text style={styles.insightText}>
                    {analytics.bestPerformingHabit || 'No data yet'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>📈</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Improvement Rate</Text>
                  <Text style={[
                    styles.insightText,
                    { color: analytics.improvementRate >= 0 ? theme.colors.success : theme.colors.error }
                  ]}>
                    {analytics.improvementRate >= 0 ? '+' : ''}{Math.round(analytics.improvementRate)}% vs last week
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>⚡</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Daily Average</Text>
                  <Text style={styles.insightText}>
                    {Math.round(analytics.averageDailyCompletion * 10) / 10} completions per day
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Achievements */}
        <Animated.View 
          style={[
            styles.achievementsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>🏅 Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <Animated.View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  {
                    opacity: achievement.unlocked ? 1 : 0.4,
                  },
                  {
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 30],
                          outputRange: [0, 10 + index * 5],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                {achievement.unlocked && (
                  <View style={styles.achievementBadge}>
                    <Text style={styles.achievementBadgeText}>✓</Text>
                  </View>
                )}
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Data Export */}
        <Animated.View 
          style={[
            styles.exportContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity onPress={handleExportData} style={styles.exportButton}>
            <LinearGradient
              colors={theme.gradients.purple as [string, string, ...string[]]}
              style={styles.exportButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.exportButtonText}>📊 Export Data</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.exportDescription}>
            Export your habit data for external analysis or backup
          </Text>
        </Animated.View>
      </ScrollView>
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
    width: width * 1.2,
    height: height * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: theme.colors.primary,
    top: -height * 0.1,
    left: -width * 0.1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  avatarGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    opacity: 0.1,
    top: -5,
    left: -5,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  fullName: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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
  },
  signOutText: {
    fontSize: 20,
  },

  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },

  // Metrics
  metricsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Charts
  chartContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: theme.spacing.md,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  chartBarValue: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  chartDescription: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Insights
  insightsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  insightsList: {
    gap: theme.spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  insightText: {
    fontSize: 12,
    color: theme.colors.textLight,
  },

  // Achievements
  achievementsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  achievementCard: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 11,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  achievementBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadgeText: {
    fontSize: 12,
    color: theme.colors.textOnPrimary,
    fontWeight: '700',
  },

  // Export
  exportContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  exportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  exportButtonGradient: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  exportButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  exportDescription: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});

export default ProfileScreen;
