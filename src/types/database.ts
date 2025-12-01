// ===========================================
// GGZA Database Types
// ===========================================

export type GameSlug = 'cs2' | 'valorant' | 'fifa' | 'fortnite' | 'apex';

export type UserRole = 'admin' | 'community_manager' | 'quiz_master' | 'bot_dev' | 'moderator' | 'verified' | 'unverified' | 'premium' | 'winner';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'kyc_required' | 'kyc_pending' | 'kyc_verified';

export type QuizStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';

export type StrikeType = 'warning' | 'ban_7day' | 'ban_season' | 'ban_permanent';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      games: {
        Row: Game;
        Insert: Omit<Game, 'id' | 'created_at'>;
        Update: Partial<Omit<Game, 'id'>>;
      };
      user_games: {
        Row: UserGame;
        Insert: Omit<UserGame, 'id' | 'created_at'>;
        Update: Partial<Omit<UserGame, 'id'>>;
      };
      quizzes: {
        Row: Quiz;
        Insert: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Quiz, 'id'>>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at'>;
        Update: Partial<Omit<Question, 'id'>>;
      };
      quiz_questions: {
        Row: QuizQuestion;
        Insert: Omit<QuizQuestion, 'id'>;
        Update: Partial<Omit<QuizQuestion, 'id'>>;
      };
      quiz_responses: {
        Row: QuizResponse;
        Insert: Omit<QuizResponse, 'id' | 'created_at'>;
        Update: Partial<Omit<QuizResponse, 'id'>>;
      };
      quiz_scores: {
        Row: QuizScore;
        Insert: Omit<QuizScore, 'id' | 'created_at'>;
        Update: Partial<Omit<QuizScore, 'id'>>;
      };
      leaderboards: {
        Row: Leaderboard;
        Insert: Omit<Leaderboard, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Leaderboard, 'id'>>;
      };
      payouts: {
        Row: Payout;
        Insert: Omit<Payout, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payout, 'id'>>;
      };
      strikes: {
        Row: Strike;
        Insert: Omit<Strike, 'id' | 'created_at'>;
        Update: Partial<Omit<Strike, 'id'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never;
      };
      support_tickets: {
        Row: SupportTicket;
        Insert: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SupportTicket, 'id'>>;
      };
      sa_challenges: {
        Row: SAChallenge;
        Insert: Omit<SAChallenge, 'id' | 'created_at'>;
        Update: Partial<Omit<SAChallenge, 'id'>>;
      };
    };
  };
}

// ===========================================
// Table Interfaces
// ===========================================

export interface User {
  id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
  discord_discriminator: string | null;
  email: string;
  mobile: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  verification_status: VerificationStatus;
  role: UserRole;
  is_18_plus: boolean;
  tos_accepted: boolean;
  popia_accepted: boolean;
  newsletter_opt_in: boolean;
  whatsapp_opt_in: boolean;
  sa_challenge_passed: boolean;
  kyc_document_url: string | null;
  kyc_verified_at: string | null;
  total_wins: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  slug: GameSlug;
  name: string;
  display_name: string;
  description: string | null;
  icon_url: string | null;
  banner_url: string | null;
  color: string;
  discord_role_id: string | null;
  discord_channel_id: string | null;
  is_active: boolean;
  quiz_day: number;
  quiz_time: string;
  created_at: string;
}

export interface UserGame {
  id: string;
  user_id: string;
  game_id: string;
  is_favorite: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  game_id: string;
  title: string;
  description: string | null;
  status: QuizStatus;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  question_count: number;
  time_per_question: number;
  points_per_correct: number;
  week_number: number;
  year: number;
  is_monthly_final: boolean;
  prize_pool: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  game_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  times_used: number;
  times_correct: number;
  created_by: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_id: string;
  order_index: number;
  shuffled_options: number[];
}

export interface QuizResponse {
  id: string;
  quiz_id: string;
  user_id: string;
  question_id: string;
  selected_index: number | null;
  is_correct: boolean;
  response_time_ms: number;
  created_at: string;
}

export interface QuizScore {
  id: string;
  quiz_id: string;
  user_id: string;
  total_points: number;
  correct_answers: number;
  total_questions: number;
  total_time_ms: number;
  rank: number | null;
  created_at: string;
}

export interface Leaderboard {
  id: string;
  game_id: string;
  user_id: string;
  period_type: 'weekly' | 'monthly' | 'all_time';
  period_key: string;
  total_points: number;
  best_score: number;
  quizzes_played: number;
  best_two_scores: number[];
  best_six_weeks: number[];
  average_time_ms: number;
  rank: number | null;
  prize_won: number;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  user_id: string;
  leaderboard_id: string | null;
  amount: number;
  currency: string;
  status: PayoutStatus;
  bank_name: string | null;
  account_number_encrypted: string | null;
  account_holder: string | null;
  reference: string | null;
  processed_at: string | null;
  processed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Strike {
  id: string;
  user_id: string;
  type: StrikeType;
  reason: string;
  evidence: string | null;
  issued_by: string;
  expires_at: string | null;
  is_active: boolean;
  appealed: boolean;
  appeal_result: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_type: 'user' | 'bot' | 'system';
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  discord_thread_id: string | null;
  subject: string;
  description: string;
  category: 'general' | 'technical' | 'payout' | 'appeal' | 'verification';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface SAChallenge {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

// ===========================================
// Extended Types with Relations
// ===========================================

export interface UserWithGames extends User {
  user_games: (UserGame & { game: Game })[];
}

export interface QuizWithGame extends Quiz {
  game: Game;
}

export interface QuizWithDetails extends Quiz {
  game: Game;
  quiz_questions: (QuizQuestion & { question: Question })[];
  quiz_scores: QuizScore[];
}

export interface LeaderboardEntry extends Leaderboard {
  user: Pick<User, 'id' | 'discord_username' | 'discord_avatar' | 'first_name' | 'last_name'>;
}

export interface QuizScoreWithUser extends QuizScore {
  user: Pick<User, 'id' | 'discord_username' | 'discord_avatar' | 'first_name' | 'last_name'>;
}

