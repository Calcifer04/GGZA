-- ===========================================
-- Daily Challenges, Flash Quizzes & Practice Migration
-- ===========================================

-- ===========================================
-- Practice Sessions
-- ===========================================

CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  question_count INTEGER DEFAULT 10,
  correct_answers INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_practice_sessions_user ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_game ON practice_sessions(game_id);

-- ===========================================
-- Practice Responses
-- ===========================================

CREATE TABLE IF NOT EXISTS practice_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

CREATE INDEX idx_practice_responses_session ON practice_responses(session_id);

-- ===========================================
-- Daily Challenges
-- ===========================================

CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  question_count INTEGER DEFAULT 10,
  time_per_question INTEGER DEFAULT 10,
  xp_reward INTEGER DEFAULT 100,
  streak_bonus_multiplier DECIMAL(3,2) DEFAULT 1.5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, challenge_date)
);

CREATE INDEX idx_daily_challenges_game ON daily_challenges(game_id);
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);

-- ===========================================
-- Daily Challenge Questions (junction table)
-- ===========================================

CREATE TABLE IF NOT EXISTS daily_challenge_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  shuffled_options INTEGER[] DEFAULT '{0,1,2,3}',
  UNIQUE(challenge_id, question_id)
);

CREATE INDEX idx_daily_challenge_questions_challenge ON daily_challenge_questions(challenge_id);

-- ===========================================
-- Daily Challenge Attempts
-- ===========================================

CREATE TABLE IF NOT EXISTS daily_challenge_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  streak_bonus_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_daily_challenge_attempts_user ON daily_challenge_attempts(user_id);
CREATE INDEX idx_daily_challenge_attempts_challenge ON daily_challenge_attempts(challenge_id);

-- ===========================================
-- Daily Challenge Responses
-- ===========================================

CREATE TABLE IF NOT EXISTS daily_challenge_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES daily_challenge_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_daily_challenge_responses_attempt ON daily_challenge_responses(attempt_id);

-- ===========================================
-- User Streaks (for daily challenge streaks)
-- ===========================================

CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_challenges_completed INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_game ON user_streaks(game_id);

-- ===========================================
-- Flash Quizzes (hourly quick quizzes)
-- ===========================================

CREATE TABLE IF NOT EXISTS flash_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  question_count INTEGER DEFAULT 5,
  time_per_question INTEGER DEFAULT 8,
  xp_reward INTEGER DEFAULT 50,
  bonus_xp_threshold_ms INTEGER DEFAULT 3000,
  bonus_xp INTEGER DEFAULT 25,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flash_quizzes_game ON flash_quizzes(game_id);
CREATE INDEX idx_flash_quizzes_time ON flash_quizzes(start_time, end_time);

-- ===========================================
-- Flash Quiz Questions (junction table)
-- ===========================================

CREATE TABLE IF NOT EXISTS flash_quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flash_quiz_id UUID NOT NULL REFERENCES flash_quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  shuffled_options INTEGER[] DEFAULT '{0,1,2,3}',
  UNIQUE(flash_quiz_id, question_id)
);

CREATE INDEX idx_flash_quiz_questions_quiz ON flash_quiz_questions(flash_quiz_id);

-- ===========================================
-- Flash Quiz Attempts
-- ===========================================

CREATE TABLE IF NOT EXISTS flash_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flash_quiz_id UUID NOT NULL REFERENCES flash_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  bonus_earned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flash_quiz_id, user_id)
);

CREATE INDEX idx_flash_quiz_attempts_user ON flash_quiz_attempts(user_id);
CREATE INDEX idx_flash_quiz_attempts_quiz ON flash_quiz_attempts(flash_quiz_id);

-- ===========================================
-- Flash Quiz Responses
-- ===========================================

CREATE TABLE IF NOT EXISTS flash_quiz_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES flash_quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_flash_quiz_responses_attempt ON flash_quiz_responses(attempt_id);

-- ===========================================
-- Row Level Security
-- ===========================================

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_quiz_responses ENABLE ROW LEVEL SECURITY;

-- Public read for challenges and quizzes
CREATE POLICY "Public daily challenges read" ON daily_challenges FOR SELECT USING (true);
CREATE POLICY "Public daily challenge questions read" ON daily_challenge_questions FOR SELECT USING (true);
CREATE POLICY "Public flash quizzes read" ON flash_quizzes FOR SELECT USING (true);
CREATE POLICY "Public flash quiz questions read" ON flash_quiz_questions FOR SELECT USING (true);

-- Users can view their own practice sessions
CREATE POLICY "Users view own practice sessions" ON practice_sessions 
  FOR SELECT USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = user_id));

CREATE POLICY "Users view own practice responses" ON practice_responses 
  FOR SELECT USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = (
    SELECT user_id FROM practice_sessions WHERE id = session_id
  )));

-- Users can view their own attempts and responses
CREATE POLICY "Users view own daily attempts" ON daily_challenge_attempts 
  FOR SELECT USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = user_id));

CREATE POLICY "Users view own daily responses" ON daily_challenge_responses 
  FOR SELECT USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = (
    SELECT user_id FROM daily_challenge_attempts WHERE id = attempt_id
  )));

CREATE POLICY "Users view own streaks" ON user_streaks 
  FOR SELECT USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = user_id));

CREATE POLICY "Users view own flash attempts" ON flash_quiz_attempts 
  FOR SELECT USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = user_id));

CREATE POLICY "Users view own flash responses" ON flash_quiz_responses 
  FOR SELECT USING (auth.uid()::text = (SELECT discord_id FROM users WHERE id = (
    SELECT user_id FROM flash_quiz_attempts WHERE id = attempt_id
  )));

-- ===========================================
-- Helper function to update streak
-- ===========================================

CREATE OR REPLACE FUNCTION update_daily_challenge_streak()
RETURNS TRIGGER AS $$
DECLARE
  streak_record user_streaks%ROWTYPE;
  challenge_record daily_challenges%ROWTYPE;
  yesterday DATE;
BEGIN
  -- Only process on completion
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get challenge info
  SELECT * INTO challenge_record FROM daily_challenges WHERE id = NEW.challenge_id;
  
  -- Get or create streak record
  SELECT * INTO streak_record FROM user_streaks 
    WHERE user_id = NEW.user_id AND game_id = challenge_record.game_id;
  
  yesterday := CURRENT_DATE - INTERVAL '1 day';
  
  IF streak_record IS NULL THEN
    -- Create new streak record
    INSERT INTO user_streaks (user_id, game_id, current_streak, longest_streak, total_challenges_completed, last_completed_at)
    VALUES (NEW.user_id, challenge_record.game_id, 1, 1, 1, NOW());
  ELSE
    -- Update existing streak
    IF streak_record.last_completed_at::date = yesterday THEN
      -- Continuing streak
      UPDATE user_streaks SET
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        total_challenges_completed = total_challenges_completed + 1,
        last_completed_at = NOW(),
        updated_at = NOW()
      WHERE user_id = NEW.user_id AND game_id = challenge_record.game_id;
    ELSIF streak_record.last_completed_at::date < yesterday THEN
      -- Streak broken, start new
      UPDATE user_streaks SET
        current_streak = 1,
        total_challenges_completed = total_challenges_completed + 1,
        last_completed_at = NOW(),
        updated_at = NOW()
      WHERE user_id = NEW.user_id AND game_id = challenge_record.game_id;
    ELSE
      -- Same day, just update count
      UPDATE user_streaks SET
        total_challenges_completed = total_challenges_completed + 1,
        last_completed_at = NOW(),
        updated_at = NOW()
      WHERE user_id = NEW.user_id AND game_id = challenge_record.game_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update streak when daily challenge is completed
DROP TRIGGER IF EXISTS trigger_update_daily_streak ON daily_challenge_attempts;
CREATE TRIGGER trigger_update_daily_streak
  AFTER UPDATE OF completed_at ON daily_challenge_attempts
  FOR EACH ROW
  WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION update_daily_challenge_streak();

