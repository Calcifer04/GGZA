-- ===========================================
-- Reaction Test Leaderboard
-- ===========================================

-- Reaction test scores table
CREATE TABLE IF NOT EXISTS reaction_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_ms INTEGER NOT NULL CHECK (time_ms > 0 AND time_ms < 10000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Best scores view (one per user - their personal best)
CREATE TABLE IF NOT EXISTS reaction_best_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  best_time_ms INTEGER NOT NULL,
  attempts INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reaction_scores_user ON reaction_scores(user_id);
CREATE INDEX idx_reaction_scores_time ON reaction_scores(time_ms);
CREATE INDEX idx_reaction_scores_created ON reaction_scores(created_at);
CREATE INDEX idx_reaction_best_scores_time ON reaction_best_scores(best_time_ms);

-- Function to update best score when a new score is submitted
CREATE OR REPLACE FUNCTION update_reaction_best_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reaction_best_scores (user_id, best_time_ms, attempts, updated_at)
  VALUES (NEW.user_id, NEW.time_ms, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    best_time_ms = LEAST(reaction_best_scores.best_time_ms, NEW.time_ms),
    attempts = reaction_best_scores.attempts + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update best scores
CREATE TRIGGER trigger_update_reaction_best
  AFTER INSERT ON reaction_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_best_score();

-- Row Level Security
ALTER TABLE reaction_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reaction_best_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can read the leaderboard
CREATE POLICY "Public reaction scores read" ON reaction_scores FOR SELECT USING (true);
CREATE POLICY "Public reaction best read" ON reaction_best_scores FOR SELECT USING (true);

-- Users can insert their own scores
CREATE POLICY "Users can insert own scores" ON reaction_scores 
  FOR INSERT WITH CHECK (auth.uid()::text = (SELECT discord_id FROM users WHERE id = user_id));

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE reaction_best_scores;

