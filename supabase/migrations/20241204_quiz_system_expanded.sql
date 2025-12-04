-- ===========================================
-- GGZA Expanded Quiz System
-- Adds Practice Mode, Daily Challenges, Flash Quizzes
-- ===========================================

-- ===========================================
-- NEW ENUMS
-- ===========================================

-- Quiz type enum for different game modes
CREATE TYPE quiz_type AS ENUM ('live_event', 'practice', 'daily_challenge', 'flash_quiz');

-- ===========================================
-- MODIFY EXISTING TABLES
-- ===========================================

-- Add quiz_type to quizzes table (default to live_event for backwards compatibility)
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS quiz_type quiz_type DEFAULT 'live_event';

-- Add XP reward columns to quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS xp_per_correct INTEGER DEFAULT 5;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS xp_completion_bonus INTEGER DEFAULT 25;

-- ===========================================
-- NEW TABLES
-- ===========================================

-- Practice Sessions - Track unlimited practice plays
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  question_count INTEGER NOT NULL DEFAULT 10,
  correct_answers INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice Responses - Individual question responses in practice mode
CREATE TABLE practice_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER NOT NULL DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Challenges - One per game per day
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  question_count INTEGER DEFAULT 10,
  time_per_question INTEGER DEFAULT 10,
  xp_reward INTEGER DEFAULT 100,
  streak_bonus_multiplier DECIMAL(3,2) DEFAULT 1.5,
  difficulty difficulty_level DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, challenge_date)
);

-- Daily Challenge Questions - Link questions to daily challenges
CREATE TABLE daily_challenge_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  shuffled_options JSONB NOT NULL,
  UNIQUE(challenge_id, question_id),
  UNIQUE(challenge_id, order_index)
);

-- Daily Challenge Attempts - Track user attempts (one per day per challenge)
CREATE TABLE daily_challenge_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correct_answers INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Daily Challenge Responses - Individual question responses
CREATE TABLE daily_challenge_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES daily_challenge_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER NOT NULL DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- User Streaks - Track daily challenge streaks
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_challenge_date DATE,
  total_challenges_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Flash Quizzes - Short timed quizzes that rotate hourly
CREATE TABLE flash_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  question_count INTEGER DEFAULT 5,
  time_per_question INTEGER DEFAULT 8,
  xp_reward INTEGER DEFAULT 50,
  bonus_xp_threshold_ms INTEGER DEFAULT 3000, -- Get bonus XP if avg answer time under this
  bonus_xp INTEGER DEFAULT 25,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flash Quiz Questions
CREATE TABLE flash_quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flash_quiz_id UUID NOT NULL REFERENCES flash_quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  shuffled_options JSONB NOT NULL,
  UNIQUE(flash_quiz_id, question_id),
  UNIQUE(flash_quiz_id, order_index)
);

-- Flash Quiz Attempts - Can play each flash quiz once
CREATE TABLE flash_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flash_quiz_id UUID NOT NULL REFERENCES flash_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correct_answers INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  got_speed_bonus BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flash_quiz_id, user_id)
);

-- Flash Quiz Responses
CREATE TABLE flash_quiz_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES flash_quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER NOT NULL DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- User Practice Stats - Track personal bests and totals per game
CREATE TABLE user_practice_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  best_accuracy DECIMAL(5,2) DEFAULT 0, -- Best percentage in a session
  best_streak INTEGER DEFAULT 0, -- Most consecutive correct answers
  fastest_correct_ms INTEGER, -- Fastest correct answer ever
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_practice_sessions_user ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_game ON practice_sessions(game_id);
CREATE INDEX idx_practice_responses_session ON practice_responses(session_id);

CREATE INDEX idx_daily_challenges_game ON daily_challenges(game_id);
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX idx_daily_challenge_attempts_user ON daily_challenge_attempts(user_id);
CREATE INDEX idx_daily_challenge_attempts_challenge ON daily_challenge_attempts(challenge_id);

CREATE INDEX idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_game ON user_streaks(game_id);

CREATE INDEX idx_flash_quizzes_game ON flash_quizzes(game_id);
CREATE INDEX idx_flash_quizzes_time ON flash_quizzes(start_time, end_time);
CREATE INDEX idx_flash_quiz_attempts_user ON flash_quiz_attempts(user_id);
CREATE INDEX idx_flash_quiz_attempts_quiz ON flash_quiz_attempts(flash_quiz_id);

CREATE INDEX idx_user_practice_stats_user ON user_practice_stats(user_id);
CREATE INDEX idx_user_practice_stats_game ON user_practice_stats(game_id);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to generate daily challenges for all games
CREATE OR REPLACE FUNCTION generate_daily_challenges(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  game_record RECORD;
  challenge_id UUID;
  question_record RECORD;
  question_order INTEGER;
BEGIN
  -- Loop through all active games
  FOR game_record IN SELECT id, display_name FROM games WHERE is_active = TRUE
  LOOP
    -- Check if challenge already exists for this game and date
    IF NOT EXISTS (
      SELECT 1 FROM daily_challenges 
      WHERE game_id = game_record.id AND challenge_date = target_date
    ) THEN
      -- Create the daily challenge
      INSERT INTO daily_challenges (game_id, challenge_date, title, description, question_count, xp_reward)
      VALUES (
        game_record.id,
        target_date,
        game_record.display_name || ' Daily Challenge',
        'Test your knowledge with today''s challenge!',
        10,
        100
      )
      RETURNING id INTO challenge_id;
      
      -- Select 10 random questions for this challenge
      question_order := 0;
      FOR question_record IN 
        SELECT id FROM questions 
        WHERE game_id = game_record.id AND is_active = TRUE
        ORDER BY RANDOM()
        LIMIT 10
      LOOP
        question_order := question_order + 1;
        INSERT INTO daily_challenge_questions (challenge_id, question_id, order_index, shuffled_options)
        VALUES (
          challenge_id,
          question_record.id,
          question_order,
          (SELECT jsonb_agg(x) FROM (SELECT generate_series(0,3) AS x ORDER BY RANDOM()) t)
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate hourly flash quizzes
CREATE OR REPLACE FUNCTION generate_flash_quiz(game_uuid UUID, start_ts TIMESTAMPTZ DEFAULT NOW())
RETURNS UUID AS $$
DECLARE
  flash_id UUID;
  question_record RECORD;
  question_order INTEGER;
  end_ts TIMESTAMPTZ;
BEGIN
  end_ts := start_ts + INTERVAL '1 hour';
  
  -- Create the flash quiz
  INSERT INTO flash_quizzes (game_id, start_time, end_time, question_count, xp_reward)
  VALUES (game_uuid, start_ts, end_ts, 5, 50)
  RETURNING id INTO flash_id;
  
  -- Select 5 random questions
  question_order := 0;
  FOR question_record IN 
    SELECT id FROM questions 
    WHERE game_id = game_uuid AND is_active = TRUE
    ORDER BY RANDOM()
    LIMIT 5
  LOOP
    question_order := question_order + 1;
    INSERT INTO flash_quiz_questions (flash_quiz_id, question_id, order_index, shuffled_options)
    VALUES (
      flash_id,
      question_record.id,
      question_order,
      (SELECT jsonb_agg(x) FROM (SELECT generate_series(0,3) AS x ORDER BY RANDOM()) t)
    );
  END LOOP;
  
  RETURN flash_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update user streak after completing a daily challenge
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  challenge_record RECORD;
  streak_record RECORD;
  yesterday DATE;
BEGIN
  -- Only process completed attempts
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get challenge info
  SELECT game_id, challenge_date INTO challenge_record
  FROM daily_challenges WHERE id = NEW.challenge_id;
  
  yesterday := challenge_record.challenge_date - INTERVAL '1 day';
  
  -- Get or create streak record
  SELECT * INTO streak_record
  FROM user_streaks
  WHERE user_id = NEW.user_id AND game_id = challenge_record.game_id;
  
  IF streak_record IS NULL THEN
    -- Create new streak record
    INSERT INTO user_streaks (user_id, game_id, current_streak, longest_streak, last_challenge_date, total_challenges_completed)
    VALUES (NEW.user_id, challenge_record.game_id, 1, 1, challenge_record.challenge_date, 1);
  ELSE
    -- Update existing streak
    IF streak_record.last_challenge_date = yesterday THEN
      -- Continuing streak
      UPDATE user_streaks
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_challenge_date = challenge_record.challenge_date,
        total_challenges_completed = total_challenges_completed + 1,
        updated_at = NOW()
      WHERE user_id = NEW.user_id AND game_id = challenge_record.game_id;
    ELSIF streak_record.last_challenge_date < yesterday THEN
      -- Streak broken, start new
      UPDATE user_streaks
      SET 
        current_streak = 1,
        last_challenge_date = challenge_record.challenge_date,
        total_challenges_completed = total_challenges_completed + 1,
        updated_at = NOW()
      WHERE user_id = NEW.user_id AND game_id = challenge_record.game_id;
    END IF;
    -- If last_challenge_date = challenge_date, they already completed today (shouldn't happen due to unique constraint)
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for streak updates
CREATE TRIGGER trigger_update_streak
AFTER UPDATE OF completed_at ON daily_challenge_attempts
FOR EACH ROW
WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
EXECUTE FUNCTION update_user_streak();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_practice_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own practice sessions" ON practice_sessions FOR SELECT USING (auth.uid()::text IN (SELECT discord_id FROM users WHERE id = user_id));
CREATE POLICY "Users can view own practice responses" ON practice_responses FOR SELECT USING (auth.uid()::text IN (SELECT discord_id FROM users WHERE users.id IN (SELECT user_id FROM practice_sessions WHERE practice_sessions.id = session_id)));
CREATE POLICY "Users can view own daily attempts" ON daily_challenge_attempts FOR SELECT USING (auth.uid()::text IN (SELECT discord_id FROM users WHERE id = user_id));
CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid()::text IN (SELECT discord_id FROM users WHERE id = user_id));
CREATE POLICY "Users can view own flash attempts" ON flash_quiz_attempts FOR SELECT USING (auth.uid()::text IN (SELECT discord_id FROM users WHERE id = user_id));
CREATE POLICY "Users can view own practice stats" ON user_practice_stats FOR SELECT USING (auth.uid()::text IN (SELECT discord_id FROM users WHERE id = user_id));

-- Public read for challenges and flash quizzes (schedule only)
CREATE POLICY "Public daily challenges read" ON daily_challenges FOR SELECT USING (true);
CREATE POLICY "Public flash quizzes read" ON flash_quizzes FOR SELECT USING (true);

-- ===========================================
-- CRON JOBS (requires pg_cron extension)
-- Run these manually or set up with Supabase Edge Functions
-- ===========================================

-- Generate daily challenges at midnight SAST (22:00 UTC)
-- SELECT cron.schedule('generate-daily-challenges', '0 22 * * *', 'SELECT generate_daily_challenges()');

-- Clean up old flash quizzes (keep 7 days)
-- SELECT cron.schedule('cleanup-flash-quizzes', '0 0 * * *', 'DELETE FROM flash_quizzes WHERE end_time < NOW() - INTERVAL ''7 days''');

