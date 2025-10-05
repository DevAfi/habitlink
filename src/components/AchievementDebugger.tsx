import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../utils/theme';
import { achievementService } from '../services/achievementService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

const AchievementDebugger = () => {
  const { user } = useAuth();
  const [debugging, setDebugging] = useState(false);

  const runDebugChecks = async () => {
    if (!user) {
      Alert.alert('Debug Error', 'No user found');
      return;
    }

    setDebugging(true);
    console.log('🔍 Starting achievement system debug...');

    try {
      // Check if achievements table exists
      console.log('1️⃣ Checking achievements table...');
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .limit(1);

      if (achievementsError) {
        console.error('❌ Achievements table error:', achievementsError);
        Alert.alert('Debug Result', `Achievements table error: ${achievementsError.message}`);
        return;
      }

      console.log('✅ Achievements table accessible, found', achievements?.length || 0, 'achievements');

      // Check if user_achievements table exists
      console.log('2️⃣ Checking user_achievements table...');
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (userAchievementsError) {
        console.error('❌ User achievements table error:', userAchievementsError);
        Alert.alert('Debug Result', `User achievements table error: ${userAchievementsError.message}`);
        return;
      }

      console.log('✅ User achievements table accessible, found', userAchievements?.length || 0, 'user achievements');

      // Check if user_stats table exists
      console.log('3️⃣ Checking user_stats table...');
      const { data: userStats, error: userStatsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (userStatsError) {
        console.error('❌ User stats table error:', userStatsError);
        Alert.alert('Debug Result', `User stats table error: ${userStatsError.message}`);
        return;
      }

      console.log('✅ User stats table accessible, found', userStats?.length || 0, 'user stats');

      // Check if the RPC function exists
      console.log('4️⃣ Testing achievement checking function...');
      try {
        const result = await achievementService.checkAndAwardAchievements(user.id);
        console.log('✅ Achievement checking function works, returned:', result.length, 'achievements');
      } catch (rpcError) {
        console.error('❌ Achievement checking function error:', rpcError);
        Alert.alert('Debug Result', `Achievement checking function error: ${rpcError.message}`);
        return;
      }

      // Test fetching user data
      console.log('5️⃣ Testing user data fetching...');
      const [earned, available, stats] = await Promise.all([
        achievementService.getUserAchievements(user.id),
        achievementService.getAvailableAchievements(user.id),
        achievementService.getUserStats(user.id)
      ]);

      console.log('✅ User data fetching works:');
      console.log('- Earned achievements:', earned.length);
      console.log('- Available achievements:', available.length);
      console.log('- User stats:', stats ? 'Found' : 'Not found');

      Alert.alert(
        'Debug Complete',
        `✅ All checks passed!\n\n` +
        `- Achievements: ${achievements?.length || 0}\n` +
        `- User Achievements: ${earned.length}\n` +
        `- Available: ${available.length}\n` +
        `- User Stats: ${stats ? 'Found' : 'Not found'}\n\n` +
        `Check console for detailed logs.`
      );

    } catch (error) {
      console.error('💥 Debug error:', error);
      Alert.alert('Debug Error', `Unexpected error: ${error.message}`);
    } finally {
      setDebugging(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.debugButton}
      onPress={runDebugChecks}
      disabled={debugging}
      activeOpacity={0.8}
    >
      <Text style={styles.debugButtonText}>
        {debugging ? '🔍 Debugging...' : '🔍 Debug Achievements'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  debugButton: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
    alignSelf: 'center',
  },
  debugButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AchievementDebugger;
