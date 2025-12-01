# GGZA - South African Gaming Quiz Hub

A comprehensive gaming quiz platform for South African gamers featuring weekly quizzes, cash prizes, Discord integration, and competitive leaderboards.

## 🎮 Features

- **Weekly Quiz Nights** - CS2, Valorant, FIFA, Fortnite, and Apex Legends
- **Cash Prizes** - R1,000 weekly (R500/R300/R200), R5,000 monthly finals
- **Discord Integration** - OAuth login, role management, notifications
- **Leaderboards** - Weekly, monthly, and all-time rankings
- **Anti-Cheat** - Randomized questions, short timers, no text selection
- **SA Verification** - Knowledge challenge to verify South African players
- **Admin Dashboard** - Question bank, quiz management, payouts

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Discord OAuth 2.0
- **Bot**: Discord.js v14
- **Styling**: Tailwind CSS, Framer Motion
- **Icons**: Lucide React

## 📁 Project Structure

```
ggza/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Protected routes
│   │   │   ├── admin/          # Admin pages
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── hub/            # Game hubs
│   │   │   ├── leaderboard/    # Leaderboards
│   │   │   ├── profile/        # User profile
│   │   │   └── quiz/           # Quiz engine
│   │   ├── api/                # API routes
│   │   ├── login/              # Login page
│   │   └── onboarding/         # User onboarding
│   ├── components/             # React components
│   │   ├── admin/              # Admin components
│   │   ├── layout/             # Layout components
│   │   ├── profile/            # Profile components
│   │   └── ui/                 # UI primitives
│   ├── lib/                    # Utilities
│   │   ├── supabase/           # Supabase clients
│   │   ├── auth.ts             # Auth helpers
│   │   ├── discord.ts          # Discord utilities
│   │   └── utils.ts            # General utilities
│   └── types/                  # TypeScript types
├── bot/                        # Discord bot
├── supabase/                   # Database schema
└── docs/                       # Documentation
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- Supabase account
- Discord Developer Application

### 1. Clone and Install

```bash
git clone <repo-url>
cd ggza
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project
2. Go to SQL Editor and run `supabase/schema.sql`
3. Copy your project URL and anon key

### 3. Set Up Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 and add redirect URL: `http://localhost:3000/api/auth/discord/callback`
4. Enable required scopes: `identify`, `email`, `guilds.join`
5. Create a bot and get the token
6. Invite bot to your server with admin permissions

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Discord
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_server_id

# Discord Roles (create these in your server)
DISCORD_ROLE_VERIFIED=role_id
DISCORD_ROLE_UNVERIFIED=role_id
DISCORD_ROLE_CS2=role_id
DISCORD_ROLE_VALORANT=role_id
DISCORD_ROLE_FIFA=role_id
DISCORD_ROLE_FORTNITE=role_id
DISCORD_ROLE_APEX=role_id

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/your-invite
```

### 5. Run Development Servers

```bash
# Terminal 1 - Website
npm run dev

# Terminal 2 - Discord Bot
cd bot
npm install
npm run dev
```

### 6. Access the App

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin (requires admin role)

## 📊 Database Schema

### Core Tables

- `users` - User accounts linked to Discord
- `games` - Game configurations (CS2, Valorant, etc.)
- `user_games` - User's selected games
- `quizzes` - Quiz events
- `questions` - Question bank
- `quiz_questions` - Questions assigned to quizzes
- `quiz_responses` - User answers
- `quiz_scores` - Final quiz scores
- `leaderboards` - Weekly/monthly rankings
- `payouts` - Prize payouts
- `strikes` - User violations
- `audit_logs` - Activity logs
- `support_tickets` - Support requests
- `sa_challenges` - SA verification questions

## 🎯 Quiz System

### Flow
1. Admin creates questions in question bank
2. Admin schedules quiz and assigns questions
3. Users join quiz when it goes live
4. 30 questions, 5 seconds each, randomized order
5. Options shuffled for each user
6. Scores calculated: 10 points per correct answer
7. Ties broken by fastest total time

### Anti-Cheat Measures
- No text selection in quiz UI
- Short answer windows (5 seconds)
- Randomized question order
- Randomized option order
- Server-side answer validation

## 🏆 Prize Structure

### Weekly Prizes (per game)
- 1st Place: R500
- 2nd Place: R300
- 3rd Place: R200

**Calculation**: Best 2 quiz scores per week

### Monthly Finals
- 1st Place: R2,500
- 2nd Place: R1,500
- 3rd Place: R1,000

**Calculation**: Best 6 weekly scores

## 👨‍💼 Admin Features

- User management and role assignment
- Question bank with difficulty ratings
- Quiz scheduling and management
- Payout processing
- Strike/ban management
- Audit logs
- Analytics

## 🤖 Discord Bot Commands

- `/register` - Get registration link
- `/verify` - Check verification status
- `/rank [game]` - View your ranking
- `/leaderboard <game>` - View game leaderboard
- `/schedule` - View weekly schedule
- `/profile` - View your profile
- `/help` - List all commands

## 🚀 Deployment

### Website (Vercel/Railway)

1. Connect GitHub repo
2. Set environment variables
3. Deploy

### Discord Bot (Railway/Fly.io)

1. Deploy `bot/` folder
2. Set environment variables
3. Ensure 24/7 uptime

### Database (Supabase)

- Automatic with Supabase hosting
- Enable Point-in-Time Recovery for backups

## 🔒 Security

- Discord OAuth for authentication
- Server-side session management
- Row Level Security in Supabase
- Admin role verification
- POPIA-compliant data handling
- Encrypted sensitive data (bank details)

## 📝 License

Private project for GGZA.

---

Built with ❤️ for South African gamers.

