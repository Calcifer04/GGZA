-- ===========================================
-- GGZA Database Schema
-- Run this in Supabase SQL Editor
-- ===========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE game_slug AS ENUM ('cs2', 'valorant', 'fifa', 'fortnite', 'apex');
CREATE TYPE user_role AS ENUM ('admin', 'community_manager', 'quiz_master', 'bot_dev', 'moderator', 'verified', 'unverified', 'premium', 'winner');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'kyc_required', 'kyc_pending', 'kyc_verified');
CREATE TYPE quiz_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'rejected');
CREATE TYPE strike_type AS ENUM ('warning', 'ban_7day', 'ban_season', 'ban_permanent');
CREATE TYPE period_type AS ENUM ('weekly', 'monthly', 'all_time');
CREATE TYPE ticket_category AS ENUM ('general', 'technical', 'payout', 'appeal', 'verification');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE actor_type AS ENUM ('user', 'bot', 'system');

-- ===========================================
-- TABLES
-- ===========================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discord_id TEXT UNIQUE NOT NULL,
  discord_username TEXT NOT NULL,
  discord_avatar TEXT,
  discord_discriminator TEXT,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  verification_status verification_status DEFAULT 'pending',
  role user_role DEFAULT 'unverified',
  is_18_plus BOOLEAN DEFAULT FALSE,
  tos_accepted BOOLEAN DEFAULT FALSE,
  popia_accepted BOOLEAN DEFAULT FALSE,
  newsletter_opt_in BOOLEAN DEFAULT FALSE,
  whatsapp_opt_in BOOLEAN DEFAULT FALSE,
  sa_challenge_passed BOOLEAN DEFAULT FALSE,
  kyc_document_url TEXT,
  kyc_verified_at TIMESTAMPTZ,
  total_wins INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug game_slug UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  color TEXT NOT NULL DEFAULT '#FFD700',
  discord_role_id TEXT,
  discord_channel_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  quiz_day INTEGER NOT NULL CHECK (quiz_day >= 0 AND quiz_day <= 6),
  quiz_time TIME NOT NULL DEFAULT '19:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Games junction table
CREATE TABLE user_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status quiz_status DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 180,
  question_count INTEGER DEFAULT 30,
  time_per_question INTEGER DEFAULT 5,
  points_per_correct INTEGER DEFAULT 10,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_monthly_final BOOLEAN DEFAULT FALSE,
  prize_pool DECIMAL(10,2) DEFAULT 1000,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions bank
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  difficulty difficulty_level DEFAULT 'medium',
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  times_used INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz-Questions junction (with randomization)
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  shuffled_options JSONB NOT NULL,
  UNIQUE(quiz_id, question_id),
  UNIQUE(quiz_id, order_index)
);

-- User responses to quiz questions
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER NOT NULL DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, user_id, question_id)
);

-- Quiz scores (calculated after quiz ends)
CREATE TABLE quiz_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 30,
  total_time_ms INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, user_id)
);

-- Leaderboards (weekly, monthly, all-time)
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type period_type NOT NULL,
  period_key TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  quizzes_played INTEGER DEFAULT 0,
  best_two_scores JSONB DEFAULT '[]',
  best_six_weeks JSONB DEFAULT '[]',
  average_time_ms INTEGER DEFAULT 0,
  rank INTEGER,
  prize_won DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id, period_type, period_key)
);

-- Payouts
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_id UUID REFERENCES leaderboards(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  status payout_status DEFAULT 'pending',
  bank_name TEXT,
  account_number_encrypted TEXT,
  account_holder TEXT,
  reference TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strikes / Bans
CREATE TABLE strikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type strike_type NOT NULL,
  reason TEXT NOT NULL,
  evidence TEXT,
  issued_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  appealed BOOLEAN DEFAULT FALSE,
  appeal_result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id),
  actor_type actor_type NOT NULL DEFAULT 'user',
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discord_thread_id TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category DEFAULT 'general',
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SA Knowledge challenge questions
CREATE TABLE sa_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification ON users(verification_status);
CREATE INDEX idx_user_games_user ON user_games(user_id);
CREATE INDEX idx_user_games_game ON user_games(game_id);
CREATE INDEX idx_quizzes_game ON quizzes(game_id);
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_quizzes_scheduled ON quizzes(scheduled_at);
CREATE INDEX idx_questions_game ON questions(game_id);
CREATE INDEX idx_quiz_responses_quiz ON quiz_responses(quiz_id);
CREATE INDEX idx_quiz_responses_user ON quiz_responses(user_id);
CREATE INDEX idx_quiz_scores_quiz ON quiz_scores(quiz_id);
CREATE INDEX idx_quiz_scores_user ON quiz_scores(user_id);
CREATE INDEX idx_leaderboards_game ON leaderboards(game_id);
CREATE INDEX idx_leaderboards_user ON leaderboards(user_id);
CREATE INDEX idx_leaderboards_period ON leaderboards(period_type, period_key);
CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_strikes_user ON strikes(user_id);
CREATE INDEX idx_strikes_active ON strikes(is_active);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboards_updated_at BEFORE UPDATE ON leaderboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = discord_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = discord_id);

-- Public read for leaderboards
CREATE POLICY "Public leaderboard read" ON leaderboards FOR SELECT TO authenticated USING (true);

-- Public read for games
CREATE POLICY "Public games read" ON games FOR SELECT USING (true);

-- Public read for quizzes
CREATE POLICY "Public quizzes read" ON quizzes FOR SELECT USING (true);

-- ===========================================
-- SEED DATA
-- ===========================================

-- Insert default games
INSERT INTO games (slug, name, display_name, description, color, quiz_day, quiz_time) VALUES
('cs2', 'cs2', 'Counter-Strike 2', 'Test your CS2 knowledge with weapon stats, map callouts, pro scene trivia, and game mechanics.', '#DE9B35', 1, '19:00'),
('valorant', 'valorant', 'VALORANT', 'Prove your Valorant expertise with agent abilities, map knowledge, esports history, and game updates.', '#FD4556', 2, '19:00'),
('fifa', 'fifa', 'EA FC / FIFA', 'Show off your football gaming knowledge with player ratings, game mechanics, and FUT wisdom.', '#326295', 3, '19:00'),
('fortnite', 'fortnite', 'Fortnite', 'Battle royale trivia covering weapons, locations, seasons, collaborations, and competitive play.', '#9D4DFF', 4, '19:00'),
('apex', 'apex', 'Apex Legends', 'Legend abilities, weapon stats, map rotations, and everything Apex Legends.', '#DA292A', 5, '19:00');

-- Insert SA challenge questions
INSERT INTO sa_challenges (question, options, correct_index, category) VALUES
('What is the capital city of South Africa that houses the Union Buildings?', '["Cape Town", "Pretoria", "Johannesburg", "Durban"]', 1, 'geography'),
('Which South African dish consists of minced meat baked with an egg-based topping?', '["Bunny Chow", "Bobotie", "Boerewors", "Biltong"]', 1, 'food'),
('What is the name of South Africa''s national anthem?', '["Nkosi Sikelel'' iAfrika", "Die Stem", "National Anthem of South Africa", "Shosholoza"]', 2, 'culture'),
('Which South African city is known as the "Mother City"?', '["Johannesburg", "Durban", "Cape Town", "Pretoria"]', 2, 'geography'),
('What are the two animals on the South African coat of arms?', '["Lions", "Springbok", "Secretary Birds", "Elephants"]', 2, 'culture'),
('Which iconic South African rugby team is known as the Springboks?', '["National Cricket Team", "National Rugby Team", "National Soccer Team", "National Hockey Team"]', 1, 'sports'),
('What is "lekker" commonly used to describe in South African slang?', '["Something bad", "Something nice/great", "A type of food", "A greeting"]', 1, 'language'),
('Table Mountain overlooks which South African city?', '["Johannesburg", "Durban", "Cape Town", "Port Elizabeth"]', 2, 'geography'),
('What currency does South Africa use?', '["Dollar", "Pound", "Rand", "Euro"]', 2, 'general'),
('Which South African president received the Nobel Peace Prize in 1993?', '["Thabo Mbeki", "Jacob Zuma", "Nelson Mandela", "F.W. de Klerk"]', 2, 'history');

