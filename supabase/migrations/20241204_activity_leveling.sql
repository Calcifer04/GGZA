-- ===========================================
-- Activity & Leveling System Migration
-- ===========================================

-- Add XP and level fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- ===========================================
-- User Activity Tracking (Presence System)
-- ===========================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'in_quiz', 'in_voice')),
  current_page TEXT,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  session_started TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id)
);

CREATE INDEX idx_user_activity_status ON user_activity(status);
CREATE INDEX idx_user_activity_game ON user_activity(game_id);
CREATE INDEX idx_user_activity_heartbeat ON user_activity(last_heartbeat);

-- ===========================================
-- XP Transactions Log
-- ===========================================

CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('quiz', 'mission', 'streak', 'achievement', 'daily', 'bonus', 'admin')),
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created ON xp_transactions(created_at);

-- ===========================================
-- Missions System
-- ===========================================

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  icon TEXT DEFAULT 'star',
  mission_type TEXT NOT NULL CHECK (mission_type IN ('daily', 'weekly', 'achievement', 'special')),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('visit_hub', 'play_quiz', 'score_points', 'win_quiz', 'streak', 'claim_daily', 'invite_friend', 'profile_complete')),
  requirement_value INTEGER DEFAULT 1,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_missions_type ON missions(mission_type);
CREATE INDEX idx_missions_active ON missions(is_active);

-- ===========================================
-- User Mission Progress
-- ===========================================

CREATE TABLE IF NOT EXISTS user_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  period_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mission_id, period_key)
);

CREATE INDEX idx_user_missions_user ON user_missions(user_id);
CREATE INDEX idx_user_missions_period ON user_missions(period_key);
CREATE INDEX idx_user_missions_completed ON user_missions(completed);

-- ===========================================
-- Level Thresholds (reference table)
-- ===========================================

CREATE TABLE IF NOT EXISTS level_thresholds (
  level INTEGER PRIMARY KEY,
  xp_required INTEGER NOT NULL,
  title TEXT,
  badge_color TEXT DEFAULT '#FFD700'
);

-- Insert level thresholds (exponential curve)
INSERT INTO level_thresholds (level, xp_required, title, badge_color) VALUES
(1, 0, 'Rookie', '#9CA3AF'),
(2, 100, 'Rookie', '#9CA3AF'),
(3, 250, 'Rookie', '#9CA3AF'),
(4, 500, 'Apprentice', '#60A5FA'),
(5, 850, 'Apprentice', '#60A5FA'),
(6, 1300, 'Apprentice', '#60A5FA'),
(7, 1900, 'Competitor', '#34D399'),
(8, 2700, 'Competitor', '#34D399'),
(9, 3700, 'Competitor', '#34D399'),
(10, 5000, 'Expert', '#A78BFA'),
(11, 6500, 'Expert', '#A78BFA'),
(12, 8500, 'Expert', '#A78BFA'),
(13, 11000, 'Master', '#F59E0B'),
(14, 14000, 'Master', '#F59E0B'),
(15, 18000, 'Master', '#F59E0B'),
(16, 23000, 'Grandmaster', '#EF4444'),
(17, 29000, 'Grandmaster', '#EF4444'),
(18, 36000, 'Grandmaster', '#EF4444'),
(19, 45000, 'Legend', '#FFD700'),
(20, 55000, 'Legend', '#FFD700'),
(21, 70000, 'Champion', '#FF6B6B'),
(22, 90000, 'Champion', '#FF6B6B'),
(23, 115000, 'Champion', '#FF6B6B'),
(24, 145000, 'Immortal', '#00D9FF'),
(25, 200000, 'Immortal', '#00D9FF')
ON CONFLICT (level) DO NOTHING;

-- ===========================================
-- Seed Default Missions
-- ===========================================

INSERT INTO missions (slug, title, description, xp_reward, icon, mission_type, requirement_type, requirement_value, sort_order) VALUES
-- Daily Missions
('daily_visit_hub', 'Visit a Hub', 'Check out any game hub', 25, 'gamepad', 'daily', 'visit_hub', 1, 1),
('daily_play_quiz', 'Quiz Champion', 'Complete a quiz challenge', 50, 'zap', 'daily', 'play_quiz', 1, 2),
('daily_claim', 'Daily Reward', 'Collect your daily bonus', 15, 'gift', 'daily', 'claim_daily', 1, 3),
('daily_score_100', 'Point Scorer', 'Earn 100+ points in a quiz', 35, 'target', 'daily', 'score_points', 100, 4),

-- Weekly Missions  
('weekly_play_3', 'Weekly Warrior', 'Complete 3 quizzes this week', 100, 'trophy', 'weekly', 'play_quiz', 3, 1),
('weekly_score_500', 'High Scorer', 'Earn 500 total points this week', 75, 'flame', 'weekly', 'score_points', 500, 2),
('weekly_streak_3', 'Streak Builder', 'Maintain a 3-day login streak', 60, 'fire', 'weekly', 'streak', 3, 3),
('weekly_win', 'Weekly Victor', 'Win a quiz this week', 150, 'crown', 'weekly', 'win_quiz', 1, 4),

-- Achievement Missions (one-time)
('achieve_first_quiz', 'First Steps', 'Complete your first quiz', 100, 'star', 'achievement', 'play_quiz', 1, 1),
('achieve_win_first', 'First Victory', 'Win your first quiz', 250, 'medal', 'achievement', 'win_quiz', 1, 2),
('achieve_streak_7', 'Week Warrior', 'Achieve a 7-day login streak', 200, 'calendar', 'achievement', 'streak', 7, 3),
('achieve_streak_30', 'Monthly Devotee', '30-day login streak', 500, 'crown', 'achievement', 'streak', 30, 4),
('achieve_level_10', 'Expert Status', 'Reach level 10', 300, 'award', 'achievement', 'score_points', 0, 5),
('achieve_profile', 'Profile Pro', 'Complete your profile', 50, 'user', 'achievement', 'profile_complete', 1, 6)
ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- Functions for Activity System
-- ===========================================

-- Function to update user level based on XP
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
BEGIN
  SELECT level INTO new_level
  FROM level_thresholds
  WHERE xp_required <= NEW.xp
  ORDER BY level DESC
  LIMIT 1;
  
  IF new_level IS NOT NULL AND new_level != NEW.level THEN
    NEW.level := new_level;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update level when XP changes
DROP TRIGGER IF EXISTS trigger_update_user_level ON users;
CREATE TRIGGER trigger_update_user_level
  BEFORE UPDATE OF xp ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Function to clean up stale activity (users offline for > 5 min)
CREATE OR REPLACE FUNCTION cleanup_stale_activity()
RETURNS void AS $$
BEGIN
  DELETE FROM user_activity
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to get online counts per game
CREATE OR REPLACE FUNCTION get_hub_activity()
RETURNS TABLE (
  game_id UUID,
  game_slug TEXT,
  online_count BIGINT,
  in_quiz_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as game_id,
    g.slug::TEXT as game_slug,
    COUNT(ua.id) FILTER (WHERE ua.status IN ('online', 'away', 'in_quiz')) as online_count,
    COUNT(ua.id) FILTER (WHERE ua.status = 'in_quiz') as in_quiz_count
  FROM games g
  LEFT JOIN user_activity ua ON ua.game_id = g.id 
    AND ua.last_heartbeat > NOW() - INTERVAL '5 minutes'
  WHERE g.is_active = true
  GROUP BY g.id, g.slug;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- Row Level Security
-- ===========================================

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;

-- Users can view all activity (for live counts)
CREATE POLICY "Public activity read" ON user_activity FOR SELECT USING (true);

-- Users can only modify their own activity
CREATE POLICY "Users can manage own activity" ON user_activity 
  FOR ALL USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = user_id));

-- Users can view their own XP transactions
CREATE POLICY "Users view own xp" ON xp_transactions 
  FOR SELECT USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = user_id));

-- Users can view their own missions
CREATE POLICY "Users view own missions" ON user_missions 
  FOR SELECT USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = user_id));

-- Public read for missions and levels
CREATE POLICY "Public missions read" ON missions FOR SELECT USING (true);
CREATE POLICY "Public level thresholds read" ON level_thresholds FOR SELECT USING (true);

-- ===========================================
-- Enable Realtime for activity tracking
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE user_activity;

