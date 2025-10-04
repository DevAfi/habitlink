// src/screens/NotificationsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

interface NotificationSettings {
  dailyReminders: boolean;
  reminderTime: string;
  weeklyReports: boolean;
  streakReminders: boolean;
  friendActivity: boolean;
}

const NotificationsScreen = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyReminders: true,
    reminderTime: '09:00',
    weeklyReports: true,
    streakReminders: true,
    friendActivity: false,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const glowAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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

    fetchNotificationSettings();
    requestNotificationPermissions();

    return () => glowAnimation.stop();
  }, []);

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive habit reminders.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('notification_settings')
        .eq('user_id', user.id)
        .single();

      if (data?.notification_settings) {
        setSettings(data.notification_settings);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const saveNotificationSettings = async (newSettings: NotificationSettings) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notification_settings: newSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving notification settings:', error);
        Alert.alert('Error', 'Failed to save notification settings');
        return;
      }

      setSettings(newSettings);
      scheduleNotifications(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const scheduleNotifications = async (settings: NotificationSettings) => {
    try {
      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (settings.dailyReminders) {
        // Schedule daily habit reminder
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🌟 Daily Habit Check-in',
            body: 'Time to check off your habits for today!',
            data: { type: 'daily_reminder' },
          },
          trigger: {
            hour: parseInt(settings.reminderTime.split(':')[0]),
            minute: parseInt(settings.reminderTime.split(':')[1]),
            repeats: true,
          },
        });
      }

      if (settings.weeklyReports) {
        // Schedule weekly report (every Sunday at 10 AM)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📊 Weekly Habit Report',
            body: 'Check out your progress this week!',
            data: { type: 'weekly_report' },
          },
          trigger: {
            weekday: 1, // Sunday
            hour: 10,
            minute: 0,
            repeats: true,
          },
        });
      }

      if (settings.streakReminders) {
        // Schedule streak reminders (every day at 8 PM if no completion)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔥 Don\'t Break Your Streak!',
            body: 'You\'re on a roll! Keep it going!',
            data: { type: 'streak_reminder' },
          },
          trigger: {
            hour: 20,
            minute: 0,
            repeats: true,
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const handleToggleSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    await saveNotificationSettings(newSettings);
  };

  const handleTimeChange = async (time: string) => {
    const newSettings = { ...settings, reminderTime: time };
    await saveNotificationSettings(newSettings);
  };

  const testNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test Notification',
          body: 'Your notifications are working perfectly!',
        },
        trigger: { seconds: 2 },
      });
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotificationSettings();
    setRefreshing(false);
  };

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

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>🔔 Notifications</Text>
            <Text style={styles.subtitle}>Customize your habit reminders</Text>
          </View>

          {/* Daily Reminders Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Reminders</Text>
              <Switch
                value={settings.dailyReminders}
                onValueChange={(value) => handleToggleSetting('dailyReminders', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.textOnPrimary}
              />
            </View>
            <Text style={styles.sectionDescription}>
              Get reminded to check off your daily habits
            </Text>

            {settings.dailyReminders && (
              <View style={styles.timePicker}>
                <Text style={styles.timeLabel}>Reminder Time:</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => {
                    Alert.alert(
                      'Set Reminder Time',
                      'Choose your preferred reminder time',
                      [
                        { text: '6:00 AM', onPress: () => handleTimeChange('06:00') },
                        { text: '8:00 AM', onPress: () => handleTimeChange('08:00') },
                        { text: '9:00 AM', onPress: () => handleTimeChange('09:00') },
                        { text: '12:00 PM', onPress: () => handleTimeChange('12:00') },
                        { text: '6:00 PM', onPress: () => handleTimeChange('18:00') },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.timeButtonText}>{settings.reminderTime}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Weekly Reports Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weekly Reports</Text>
              <Switch
                value={settings.weeklyReports}
                onValueChange={(value) => handleToggleSetting('weeklyReports', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.textOnPrimary}
              />
            </View>
            <Text style={styles.sectionDescription}>
              Receive a summary of your weekly progress
            </Text>
          </View>

          {/* Streak Reminders Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Streak Reminders</Text>
              <Switch
                value={settings.streakReminders}
                onValueChange={(value) => handleToggleSetting('streakReminders', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.textOnPrimary}
              />
            </View>
            <Text style={styles.sectionDescription}>
              Get motivated to maintain your streaks
            </Text>
          </View>

          {/* Friend Activity Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Friend Activity</Text>
              <Switch
                value={settings.friendActivity}
                onValueChange={(value) => handleToggleSetting('friendActivity', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.textOnPrimary}
              />
            </View>
            <Text style={styles.sectionDescription}>
              Get notified when friends complete habits
            </Text>
          </View>

          {/* Test Notification */}
          <View style={styles.testSection}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={testNotification}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.gradients.purple as [string, string, ...string[]]}
                style={styles.testButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.testButtonText}>🔔 Test Notification</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Tips</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>• Enable daily reminders to stay consistent</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>• Set reminder time for when you're most active</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>• Weekly reports help track your progress</Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
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
  content: {
    flex: 1,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  timePicker: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  timeButton: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  testSection: {
    margin: 20,
    alignItems: 'center',
  },
  testButton: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 6px 24px rgba(107, 92, 231, 0.35)',
  },
  testButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  testButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tipsSection: {
    backgroundColor: theme.colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
});

export default NotificationsScreen;
