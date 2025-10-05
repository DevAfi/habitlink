export interface User {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface HabitWithCompletion extends Habit {
  completed_today: boolean;
  current_streak: number;
  total_completions: number;
}

export interface Completion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

export interface FriendWithStats extends User {
  total_habits: number;
  longest_streak: number;
}

export interface FeedActivity {
  id: string;
  user: User;
  habit: Habit;
  completed_at: string;
  streak: number;
  is_milestone: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'streak' | 'weekly' | 'monthly' | 'special';
  badge_color: string;
  requirements: Record<string, any>;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achieved_at: string;
  progress_data?: Record<string, any>;
  achievement?: Achievement;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_points: number;
  achievements_count: number;
  longest_streak: number;
  total_habits_completed: number;
  level: number;
  experience_points: number;
  created_at: string;
  updated_at: string;
}