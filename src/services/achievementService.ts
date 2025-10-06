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
        
        // Update XP after earning achievements
        await this.updateUserXP(userId);
      }

      return data || [];
    } catch (err) {
      console.error('💥 Exception in checkAndAwardAchievements:', err);
      return [];
    }
  },

  async updateUserXP(userId: string): Promise<void> {
    console.log('📈 Updating XP for user:', userId);
    
    try {
      // Get current user stats
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError) {
        console.error('❌ Error fetching user stats for XP update:', statsError);
        return;
      }

      if (!userStats) {
        console.log('👤 No user stats found, creating new record...');
        // Create new user stats if they don't exist
        const { error: insertError } = await supabase
          .from('user_stats')
          .insert({ user_id: userId });
        
        if (insertError) {
          console.error('❌ Error creating user stats:', insertError);
          return;
        }
        
        // Fetch the newly created stats
        const { data: newStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (!newStats) return;
        
        // Calculate XP based on achievements
        const totalXP = newStats.total_points * 10; // 10 XP per point
        const newLevel = Math.floor(totalXP / 100) + 1; // Level up every 100 XP
        
        // Update with calculated values
        const { error: updateError } = await supabase
          .from('user_stats')
          .update({
            experience_points: totalXP,
            level: newLevel
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('❌ Error updating XP:', updateError);
        } else {
          console.log('✅ Updated XP: Level', newLevel, 'with', totalXP, 'XP');
        }
        
        return;
      }

      // Calculate XP based on total points (10 XP per achievement point)
      const totalXP = userStats.total_points * 10;
      const newLevel = Math.floor(totalXP / 100) + 1; // Level up every 100 XP
      
      // Only update if level changed or XP is different
      if (newLevel !== userStats.level || totalXP !== userStats.experience_points) {
        const { error: updateError } = await supabase
          .from('user_stats')
          .update({
            experience_points: totalXP,
            level: newLevel
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('❌ Error updating XP:', updateError);
        } else {
          console.log('✅ Updated XP: Level', newLevel, 'with', totalXP, 'XP');
        }
      } else {
        console.log('📊 No XP update needed - level and XP already current');
      }
      
    } catch (err) {
      console.error('💥 Exception in updateUserXP:', err);
    }
  },

  async addCompletionXP(userId: string, habitId: string): Promise<void> {
    console.log('🎯 Adding completion XP for user:', userId, 'habit:', habitId);
    
    try {
      // Get habit details to determine XP value
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('habit_type, target_value')
        .eq('id', habitId)
        .single();

      if (habitError || !habit) {
        console.error('❌ Error fetching habit for XP calculation:', habitError);
        return;
      }

      // Calculate XP based on habit type
      let xpGained = 5; // Base XP for completing any habit
      
      if (habit.habit_type === 'count' && habit.target_value) {
        // Bonus XP for reaching targets
        xpGained += Math.min(10, Math.floor(habit.target_value / 5)); // Up to 10 bonus XP
      } else if (habit.habit_type === 'time' && habit.target_value) {
        // Bonus XP for time-based habits
        xpGained += Math.min(10, Math.floor(habit.target_value / 10)); // Up to 10 bonus XP
      }

      // Update user stats with XP
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          experience_points: supabase.raw('experience_points + ?', [xpGained]),
          total_habits_completed: supabase.raw('total_habits_completed + 1')
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Error updating completion XP:', updateError);
      } else {
        console.log('✅ Added', xpGained, 'XP for habit completion');
        
        // Check if level up occurred
        await this.checkLevelUp(userId);
      }
      
    } catch (err) {
      console.error('💥 Exception in addCompletionXP:', err);
    }
  },

  async checkLevelUp(userId: string): Promise<boolean> {
    try {
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('experience_points, level')
        .eq('user_id', userId)
        .single();

      if (statsError || !userStats) {
        return false;
      }

      const newLevel = Math.floor(userStats.experience_points / 100) + 1;
      
      if (newLevel > userStats.level) {
        // Level up!
        const { error: updateError } = await supabase
          .from('user_stats')
          .update({ level: newLevel })
          .eq('user_id', userId);

        if (!updateError) {
          console.log('🎉 LEVEL UP! User is now level', newLevel);
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('💥 Exception in checkLevelUp:', err);
      return false;
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
