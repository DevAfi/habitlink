-- =============================================
-- HABITLINK ACHIEVEMENTS SYSTEM SETUP
-- =============================================

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10) NOT NULL, -- Emoji or icon representation
    category VARCHAR(50) NOT NULL, -- e.g., 'streak', 'milestone', 'social', 'special'
    badge_color VARCHAR(7) DEFAULT '#6b5ce7', -- Hex color for the badge
    requirements JSONB NOT NULL, -- Flexible requirements structure
    points INTEGER DEFAULT 10, -- Points awarded for this achievement
    rarity VARCHAR(20) DEFAULT 'common', -- common, uncommon, rare, epic, legendary
    is_active BOOLEAN DEFAULT true, -- Whether this achievement is currently available
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table (junction table)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_data JSONB, -- Store any progress-related data
    UNIQUE(user_id, achievement_id) -- Prevent duplicate achievements
);

-- Create user_stats table for tracking overall progress
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    achievements_count INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_habits_completed INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Achievements table policies (read-only for users)
CREATE POLICY "Anyone can view active achievements" ON achievements
    FOR SELECT USING (is_active = true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view their own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update user stats when achievement is earned
CREATE OR REPLACE FUNCTION update_user_stats_on_achievement()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user stats when a new achievement is earned
    INSERT INTO user_stats (user_id, achievements_count, total_points)
    VALUES (NEW.user_id, 1, (SELECT points FROM achievements WHERE id = NEW.achievement_id))
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        achievements_count = user_stats.achievements_count + 1,
        total_points = user_stats.total_points + (SELECT points FROM achievements WHERE id = NEW.achievement_id),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user stats
CREATE TRIGGER trigger_update_user_stats_on_achievement
    AFTER INSERT ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_on_achievement();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    achievement_record RECORD;
    user_habit_count INTEGER;
    user_total_completions INTEGER;
    user_longest_streak INTEGER;
    user_weekly_completions INTEGER;
    user_monthly_completions INTEGER;
BEGIN
    -- Get user statistics
    SELECT 
        COUNT(*) as habit_count,
        COALESCE(SUM(daily_completions), 0) as total_completions,
        COALESCE(MAX(streak_length), 0) as longest_streak
    INTO user_habit_count, user_total_completions, user_longest_streak
    FROM (
        SELECT 
            h.id,
            h.title,
            COUNT(c.id) as daily_completions,
            -- Calculate streak (simplified version)
            CASE 
                WHEN COUNT(c.id) > 0 THEN 1 
                ELSE 0 
            END as streak_length
        FROM habits h
        LEFT JOIN completions c ON h.id = c.habit_id 
            AND c.user_id = user_uuid
        WHERE h.user_id = user_uuid
        GROUP BY h.id, h.title
    ) habit_stats;

    -- Get weekly completions
    SELECT COUNT(*) INTO user_weekly_completions
    FROM completions 
    WHERE user_id = user_uuid 
    AND completed_at >= NOW() - INTERVAL '7 days';

    -- Get monthly completions
    SELECT COUNT(*) INTO user_monthly_completions
    FROM completions 
    WHERE user_id = user_uuid 
    AND completed_at >= NOW() - INTERVAL '30 days';

    -- Check all achievements
    FOR achievement_record IN 
        SELECT * FROM achievements WHERE is_active = true
    LOOP
        -- Skip if user already has this achievement
        IF EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = user_uuid AND achievement_id = achievement_record.id
        ) THEN
            CONTINUE;
        END IF;

        -- Check achievement requirements based on category and requirements JSON
        CASE achievement_record.category
            WHEN 'milestone' THEN
                -- Check milestone achievements
                CASE (achievement_record.requirements->>'type')::text
                    WHEN 'first_habit' THEN
                        IF user_habit_count >= 1 THEN
                            INSERT INTO user_achievements (user_id, achievement_id)
                            VALUES (user_uuid, achievement_record.id);
                        END IF;
                    WHEN 'habit_count' THEN
                        IF user_habit_count >= (achievement_record.requirements->>'count')::integer THEN
                            INSERT INTO user_achievements (user_id, achievement_id)
                            VALUES (user_uuid, achievement_record.id);
                        END IF;
                    WHEN 'total_completions' THEN
                        IF user_total_completions >= (achievement_record.requirements->>'count')::integer THEN
                            INSERT INTO user_achievements (user_id, achievement_id)
                            VALUES (user_uuid, achievement_record.id);
                        END IF;
                END CASE;
            
            WHEN 'streak' THEN
                -- Check streak achievements
                IF user_longest_streak >= (achievement_record.requirements->>'days')::integer THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;
            
            WHEN 'weekly' THEN
                -- Check weekly achievements
                IF user_weekly_completions >= (achievement_record.requirements->>'completions')::integer THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;
            
            WHEN 'monthly' THEN
                -- Check monthly achievements
                IF user_monthly_completions >= (achievement_record.requirements->>'completions')::integer THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SAMPLE ACHIEVEMENTS DATA
-- =============================================

-- Insert sample achievements
INSERT INTO achievements (title, description, icon, category, badge_color, requirements, points, rarity) VALUES
-- Milestone Achievements
('First Steps', 'Create your first habit', '👶', 'milestone', '#10b981', '{"type": "first_habit"}', 10, 'common'),
('Habit Builder', 'Create 5 habits', '🏗️', 'milestone', '#3b82f6', '{"type": "habit_count", "count": 5}', 25, 'uncommon'),
('Habit Master', 'Create 10 habits', '🏆', 'milestone', '#8b5cf6', '{"type": "habit_count", "count": 10}', 50, 'rare'),
('Completion Novice', 'Complete 10 habits total', '✅', 'milestone', '#10b981', '{"type": "total_completions", "count": 10}', 15, 'common'),
('Completion Expert', 'Complete 100 habits total', '🎯', 'milestone', '#f59e0b', '{"type": "total_completions", "count": 100}', 75, 'epic'),

-- Streak Achievements
('Getting Started', 'Maintain a 3-day streak', '🔥', 'streak', '#ef4444', '{"days": 3}', 20, 'common'),
('Consistency King', 'Maintain a 7-day streak', '👑', 'streak', '#f59e0b', '{"days": 7}', 40, 'uncommon'),
('Streak Master', 'Maintain a 30-day streak', '💪', 'streak', '#8b5cf6', '{"days": 30}', 100, 'epic'),
('Legendary Streak', 'Maintain a 100-day streak', '🌟', 'streak', '#fbbf24', '{"days": 100}', 250, 'legendary'),

-- Weekly Achievements
('Week Warrior', 'Complete 7 habits in a week', '⚔️', 'weekly', '#3b82f6', '{"completions": 7}', 30, 'uncommon'),
('Perfect Week', 'Complete 21 habits in a week', '✨', 'weekly', '#8b5cf6', '{"completions": 21}', 60, 'rare'),

-- Monthly Achievements
('Monthly Maven', 'Complete 50 habits in a month', '📅', 'monthly', '#10b981', '{"completions": 50}', 80, 'uncommon'),
('Monthly Master', 'Complete 150 habits in a month', '🎖️', 'monthly', '#f59e0b', '{"completions": 150}', 150, 'epic'),

-- Special Achievements
('Early Bird', 'Complete a habit before 7 AM', '🐦', 'special', '#fbbf24', '{"type": "early_completion"}', 25, 'uncommon'),
('Night Owl', 'Complete a habit after 10 PM', '🦉', 'special', '#6366f1', '{"type": "late_completion"}', 25, 'uncommon'),
('Perfectionist', 'Complete all habits in a single day', '💎', 'special', '#ec4899', '{"type": "perfect_day"}', 50, 'rare');

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achieved_at ON user_achievements(achieved_at);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- =============================================
-- VIEWS FOR EASY QUERYING
-- =============================================

-- View for user achievement summary
CREATE OR REPLACE VIEW user_achievement_summary AS
SELECT 
    ua.user_id,
    COUNT(ua.id) as total_achievements,
    SUM(a.points) as total_points,
    MAX(ua.achieved_at) as latest_achievement_date,
    ARRAY_AGG(
        json_build_object(
            'id', a.id,
            'title', a.title,
            'description', a.description,
            'icon', a.icon,
            'category', a.category,
            'badge_color', a.badge_color,
            'points', a.points,
            'rarity', a.rarity,
            'achieved_at', ua.achieved_at
        ) ORDER BY ua.achieved_at DESC
    ) as achievements
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY ua.user_id;

-- View for available achievements for a user
CREATE OR REPLACE VIEW available_achievements AS
SELECT 
    a.*,
    CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as is_achieved,
    ua.achieved_at
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
WHERE a.is_active = true;

-- =============================================
-- HELPFUL QUERIES FOR TESTING
-- =============================================

-- To manually trigger achievement checking for a user:
-- SELECT check_and_award_achievements('your-user-id-here');

-- To view all achievements for a user:
-- SELECT * FROM user_achievement_summary WHERE user_id = 'your-user-id-here';

-- To view user stats:
-- SELECT * FROM user_stats WHERE user_id = 'your-user-id-here';

-- To view all available achievements:
-- SELECT * FROM available_achievements ORDER BY category, points;
