# GGZA Setup Guide

This guide walks you through setting up GGZA from scratch.

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Git** - [Download](https://git-scm.com/)
3. **Supabase Account** - [Sign up](https://supabase.com/)
4. **Discord Account** - [Discord](https://discord.com/)

## Step 1: Supabase Setup

### Create Project

1. Log in to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Fill in:
   - Organization: Select or create
   - Name: `ggza`
   - Database Password: Generate a strong password (save this!)
   - Region: Choose closest to South Africa
4. Click "Create Project" and wait for setup

### Initialize Database

1. Go to SQL Editor in Supabase
2. Create a new query
3. Copy the contents of `supabase/schema.sql`
4. Run the query

### Get API Keys

1. Go to Settings > API
2. Copy these values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Discord Application Setup

### Create Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name: `GGZA`
4. Click "Create"

### OAuth2 Configuration

1. Go to OAuth2 > General
2. Add Redirect URL:
   - Development: `http://localhost:3000/api/auth/discord/callback`
   - Production: `https://yourdomain.com/api/auth/discord/callback`
3. Copy:
   - Client ID → `DISCORD_CLIENT_ID`
   - Client Secret → `DISCORD_CLIENT_SECRET`

### Create Bot

1. Go to Bot section
2. Click "Add Bot"
3. Configure:
   - Username: `GGZA Bot`
   - Uncheck "Public Bot" if you want it private
4. Click "Reset Token" and copy → `DISCORD_BOT_TOKEN`
5. Enable Privileged Gateway Intents:
   - Server Members Intent ✓
   - Message Content Intent ✓

### Invite Bot to Server

1. Go to OAuth2 > URL Generator
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - Manage Roles
   - Send Messages
   - Embed Links
   - Use Slash Commands
4. Copy the generated URL and open it
5. Select your server and authorize

## Step 3: Discord Server Setup

### Create Roles

Create these roles in your Discord server (in order of hierarchy):

1. **Admin** - Full access
2. **Community Manager** - Staff access
3. **Quiz Master** - Quiz management
4. **Bot Dev** - Bot development
5. **Moderator** - Moderation
6. **Verified ZA** - Verified South African members
7. **Unverified** - New members
8. **Premium** - Premium subscribers (future)
9. **Winner** - Prize winners
10. **CS2** - CS2 players
11. **Valorant** - Valorant players
12. **FIFA** - FIFA players
13. **Fortnite** - Fortnite players
14. **Apex** - Apex players

Copy each role ID (right-click role → Copy ID) to environment variables.

### Create Channels

Suggested channel structure:

```
WELCOME
├── #start-here
├── #rules
├── #verify-account
├── #announcements
└── #faq

GENERAL
├── #lobby
├── #clips
├── #lfg
├── #suggestions
└── #support-tickets

GAMES
├── #cs2-quiz
├── #valorant-quiz
├── #fifa-quiz
├── #fortnite-quiz
├── #apex-quiz
└── #leaderboards

EVENTS
├── #weekly-schedule
├── #live-now
└── #winners-hall

STAFF (private)
├── #mod-chat
├── #quiz-bank
├── #appeals
├── #payouts
└── #audit-log
```

Copy relevant channel IDs to environment variables.

## Step 4: Local Development

### Install Dependencies

```bash
# Install website dependencies
npm install

# Install bot dependencies
cd bot
npm install
cd ..
```

### Configure Environment

1. Copy `.env.example` to `.env.local`
2. Fill in all values from previous steps

### Run Development Servers

```bash
# Terminal 1 - Website
npm run dev

# Terminal 2 - Bot
cd bot
npm run dev
```

### Test the Setup

1. Open http://localhost:3000
2. Click "Sign In" → Should redirect to Discord
3. Authorize the app
4. Complete onboarding
5. Try Discord commands: `/help`, `/schedule`

## Step 5: Production Deployment

### Deploy Website (Vercel)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

### Deploy Bot (Railway)

1. Create new Railway project
2. Connect GitHub repo
3. Set root directory to `bot`
4. Add environment variables
5. Deploy

### Update Discord OAuth

Add production redirect URL:
`https://yourdomain.com/api/auth/discord/callback`

## Troubleshooting

### Discord OAuth Error

- Check redirect URL matches exactly
- Ensure environment variables are correct
- Check Discord app isn't in development mode

### Database Connection Error

- Verify Supabase URL and keys
- Check if database is running
- Ensure schema was applied

### Bot Not Responding

- Check bot token is correct
- Verify bot is in the server
- Check intents are enabled
- Look at bot console for errors

## Next Steps

1. Add questions to the question bank via Admin Dashboard
2. Schedule your first quiz
3. Invite users to your Discord
4. Start promoting!

---

Need help? Open an issue on GitHub or contact support.

