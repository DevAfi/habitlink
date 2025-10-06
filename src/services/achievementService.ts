import { supabase } from './supabaseClient';
import { Achievement, UserAchievement, UserStats } from '../types/types';

export const achievementService = {
  async checkAndAwardAchievements(userId: string): Promise<UserAchievement[]> {
    console.log('🏆 Starting achievement check for user:', userId);
    
    try {
      const { data, error } = await supabase.rpc('check_and_award_achievements', {
        user_uuid: userId
      });

      if (error) {
        console.error('❌ Error checking achievements:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }

      console.log('✅ Achievement check completed. New achievements:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('🎉 New achievements earned:', data.map(a => a.title || 'Unknown'));
      }

      return data || [];
    } catch (err) {
      console.error('💥 Exception in checkAndAwardAchievements:', err);
      return [];
    }
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    console.log('📊 Fetching user achievements for:', userId);
    
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user achievements:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }

      console.log('✅ Found', data?.length || 0, 'user achievements');
      return data || [];
    } catch (err) {
      console.error('💥 Exception in getUserAchievements:', err);
      return [];
    }
  },

  async getUserStats(userId: string): Promise<UserStats | null> {
    console.log('📈 Fetching user stats for:', userId);
    
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('👤 No user stats found, creating new record...');
          const { data: newStats, error: insertError } = await supabase
            .from('user_stats')
            .insert({ user_id: userId })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Error creating user stats:', insertError);
            return null;
          }

          console.log('✅ Created new user stats:', newStats);
          return newStats;
        }
        console.error('❌ Error fetching user stats:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
      }

      console.log('✅ Found user stats:', data);
      return data;
    } catch (err) {
      console.error('💥 Exception in getUserStats:', err);
      return null;
    }
  },

  async getAvailableAchievements(userId: string): Promise<Achievement[]> {
    console.log('🎯 Fetching available achievements for:', userId);
    
    try {
      // get all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true);

      if (achievementsError) {
        console.error('❌ Error fetching all achievements:', achievementsError);
        return [];
      }

      // Then get user's earned achievements
      const { data: earnedAchievements, error: earnedError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (earnedError) {
        console.error('❌ Error fetching earned achievements:', earnedError);
        return [];
      }

      // Filter out achievements the user has already earned
      const earnedIds = new Set(earnedAchievements?.map(ea => ea.achievement_id) || []);
      const availableAchievements = allAchievements?.filter(achievement => 
        !earnedIds.has(achievement.id)
      ) || [];

      console.log('✅ Found', availableAchievements.length, 'available achievements out of', allAchievements?.length || 0, 'total');
      return availableAchievements;
    } catch (err) {
      console.error('💥 Exception in getAvailableAchievements:', err);
      return [];
    }
  },

  async getAchievementProgress(userId: string, achievementId: string): Promise<any> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single();

    if (error || !data) {
      return null;
    }

    const requirements = data.requirements;
    let progress = 0;
    let total = 1;

    switch (data.category) {
      case 'milestone':
        if (requirements.type === 'habit_count') {
          const { count: habitCount } = await supabase
            .from('habits')
            .select('id', { count: 'exact' })
            .eq('user_id', userId);
          
          progress = habitCount || 0;
          total = requirements.count;
        } else if (requirements.type === 'total_completions') {
          const { count: completionCount } = await supabase
            .from('completions')
            .select('id', { count: 'exact' })
            .eq('user_id', userId);
          
          progress = completionCount || 0;
          total = requirements.count;
        }
        break;

      case 'streak':
        const { data: habits } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', userId);

        let maxStreak = 0;
        for (const habit of habits || []) {
          const { data: completions } = await supabase
            .from('completions')
            .select('completed_at')
            .eq('habit_id', habit.id)
            .eq('user_id', userId)
            .order('completed_at', { ascending: false });

          if (completions && completions.length > 0) {
            let currentStreak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < completions.length; i++) {
              const completionDate = new Date(completions[i].completed_at);
              completionDate.setHours(0, 0, 0, 0);
              
              const expectedDate = new Date(today);
              expectedDate.setDate(today.getDate() - i);

              if (completionDate.getTime() === expectedDate.getTime()) {
                currentStreak++;
              } else {
                break;
              }
            }
            maxStreak = Math.max(maxStreak, currentStreak);
          }
        }

        progress = maxStreak;
        total = requirements.days;
        break;

      case 'weekly':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { count: weeklyCompletions } = await supabase
          .from('completions')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('completed_at', weekAgo.toISOString());

        progress = weeklyCompletions || 0;
        total = requirements.completions;
        break;

      case 'monthly':
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        
        const { count: monthlyCompletions } = await supabase
          .from('completions')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('completed_at', monthAgo.toISOString());

        progress = monthlyCompletions || 0;
        total = requirements.completions;
        break;
    }

    return {
      progress: Math.min(progress, total),
      total,
      percentage: total > 0 ? Math.round((progress / total) * 100) : 0
    };
  }
};
