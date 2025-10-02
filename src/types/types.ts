export interface User {
  id: string;
  username: string;
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