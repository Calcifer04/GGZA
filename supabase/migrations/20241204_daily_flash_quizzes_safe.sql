-- ===========================================
-- Safe Migration - Creates tables/indexes only if they don't exist
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

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_game ON practice_sessions(game_id);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint only if it doesn't exist
DO $$ BEGIN
  ALTER TABLE practice_responses ADD CONSTRAINT practice_responses_session_question_key UNIQUE(session_id, question_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_practice_responses_session ON practice_responses(session_id);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint only if it doesn't exist
DO $$ BEGIN
  ALTER TABLE daily_challenges ADD CONSTRAINT daily_challenges_game_date_key UNIQUE(game_id, challenge_date);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_daily_challenges_game ON daily_challenges(game_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);

-- ===========================================
-- Daily Challenge Questions
-- ===========================================

CREATE TABLE IF NOT EXISTS daily_challenge_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  shuffled_options INTEGER[] DEFAULT '{0,1,2,3}'
);

DO $$ BEGIN
  ALTER TABLE daily_challenge_questions ADD CONSTRAINT daily_challenge_questions_challenge_question_key UNIQUE(challenge_id, question_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_daily_challenge_questions_challenge ON daily_challenge_questions(challenge_id);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE daily_challenge_attempts ADD CONSTRAINT daily_challenge_attempts_challenge_user_key UNIQUE(challenge_id, user_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_daily_challenge_attempts_user ON daily_challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_attempts_challenge ON daily_challenge_attempts(challenge_id);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE daily_challenge_responses ADD CONSTRAINT daily_challenge_responses_attempt_question_key UNIQUE(attempt_id, question_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_daily_challenge_responses_attempt ON daily_challenge_responses(attempt_id);

-- ===========================================
-- User Streaks
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE user_streaks ADD CONSTRAINT user_streaks_user_game_key UNIQUE(user_id, game_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_game ON user_streaks(game_id);

-- ===========================================
-- Flash Quizzes
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

CREATE INDEX IF NOT EXISTS idx_flash_quizzes_game ON flash_quizzes(game_id);
CREATE INDEX IF NOT EXISTS idx_flash_quizzes_time ON flash_quizzes(start_time, end_time);

-- ===========================================
-- Flash Quiz Questions
-- ===========================================

CREATE TABLE IF NOT EXISTS flash_quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flash_quiz_id UUID NOT NULL REFERENCES flash_quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  shuffled_options INTEGER[] DEFAULT '{0,1,2,3}'
);

DO $$ BEGIN
  ALTER TABLE flash_quiz_questions ADD CONSTRAINT flash_quiz_questions_quiz_question_key UNIQUE(flash_quiz_id, question_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_flash_quiz_questions_quiz ON flash_quiz_questions(flash_quiz_id);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE flash_quiz_attempts ADD CONSTRAINT flash_quiz_attempts_quiz_user_key UNIQUE(flash_quiz_id, user_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_flash_quiz_attempts_user ON flash_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_quiz_attempts_quiz ON flash_quiz_attempts(flash_quiz_id);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE flash_quiz_responses ADD CONSTRAINT flash_quiz_responses_attempt_question_key UNIQUE(attempt_id, question_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_flash_quiz_responses_attempt ON flash_quiz_responses(attempt_id);

-- ===========================================
-- Enable RLS (safe - won't error if already enabled)
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

-- ===========================================
-- RLS Policies (drop if exists then create)
-- ===========================================

DROP POLICY IF EXISTS "Public daily challenges read" ON daily_challenges;
CREATE POLICY "Public daily challenges read" ON daily_challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public daily challenge questions read" ON daily_challenge_questions;
CREATE POLICY "Public daily challenge questions read" ON daily_challenge_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public flash quizzes read" ON flash_quizzes;
CREATE POLICY "Public flash quizzes read" ON flash_quizzes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public flash quiz questions read" ON flash_quiz_questions;
CREATE POLICY "Public flash quiz questions read" ON flash_quiz_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own practice sessions" ON practice_sessions;
CREATE POLICY "Users view own practice sessions" ON practice_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own practice responses" ON practice_responses;
CREATE POLICY "Users view own practice responses" ON practice_responses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own daily attempts" ON daily_challenge_attempts;
CREATE POLICY "Users view own daily attempts" ON daily_challenge_attempts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own daily responses" ON daily_challenge_responses;
CREATE POLICY "Users view own daily responses" ON daily_challenge_responses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own streaks" ON user_streaks;
CREATE POLICY "Users view own streaks" ON user_streaks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own flash attempts" ON flash_quiz_attempts;
CREATE POLICY "Users view own flash attempts" ON flash_quiz_attempts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own flash responses" ON flash_quiz_responses;
CREATE POLICY "Users view own flash responses" ON flash_quiz_responses FOR SELECT USING (true);

-- Done!
SELECT 'Migration completed successfully!' as status;

