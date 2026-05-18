# Grind42

A retro 8-bit tycoon game for 42 School students. Real campus log time becomes in-game currency (LogCoin). Spend it on pixel upgrades, cosmetics, and streak-saving items.

## Stack

| Layer        | Technology                            |
| ------------ | ------------------------------------- |
| Framework    | Next.js 16 (App Router)               |
| UI           | NES.css + Tailwind CSS v4             |
| State        | Zustand                               |
| Animations   | Framer Motion                         |
| Backend / DB | Supabase (PostgreSQL + Auth)          |
| Auth         | Supabase custom OAuth2 → 42 Intra     |
| 42 Data      | 42 API v2 (`/v2/me`, locations stats) |

## How it works

1. Student logs real hours on a 42 campus computer.
2. Next day they open the app and hit **Daily Claim**.
3. The server fetches yesterday's log time from the 42 API.
4. A streak multiplier (1.0× Monday → 2.0× Sunday) is applied and LogCoins are credited.
5. LogCoins are spent in the **Market** on upgrades, consumables, and cosmetics that appear on the pixel desk.

### Streak multipliers

| Day       | Multiplier                |
| --------- | ------------------------- |
| Monday    | 1.0×                      |
| Tuesday   | 1.3×                      |
| Wednesday | 1.4×                      |
| Thursday  | 1.5×                      |
| Friday    | 1.6×                      |
| Saturday  | 1.7×                      |
| Sunday    | 2.0× (weekend boss bonus) |

Missing a campus day breaks the streak. A **Bocal İzni** consumable can freeze the streak for one day.

## Project structure

```
app/
  (dashboard)/        # Authenticated routes (dashboard, market, leaderboard, dev)
  api/                # API routes (claim, clicks/sync, inventory, market)
  auth/               # OAuth callback, sign-in, sign-out
components/
  app/                # Shell, nav, sound, balance badge, hydration
  dashboard/          # CampusClicker, ClusterMap, DailyClaimButton/Modal, StatsPanel, StreakDisplay
  leaderboard/        # LeaderboardTable
  market/             # MarketGrid, MarketItem, InventoryPanel, UseItemButton
  theme/              # ThemeProvider, ThemeToggle, boot script
  ui/                 # PixelSprite
lib/
  economy.js          # calculateCoins, applyUpgradeBonus
  leaderboard.js      # Leaderboard queries
  streak.js           # getNextStreak, getMultiplier, streakDayLabel
  42api/              # 42 API client + logtime helpers
  auth/               # forty-two OAuth helpers
  market/             # Inventory helpers
  supabase/           # admin / server / client Supabase instances
store/
  usePlayerStore.js   # Balance, streak, XP, pc_level (Zustand)
  useInventoryStore.js
supabase/
  schema.sql          # Full database schema (run once after enabling auth)
  migrations/         # Incremental SQL migrations
scripts/
  setup-42-provider.mjs   # Creates/updates the custom 42 OAuth provider in Supabase
  backfill-coalitions.mjs # Backfills coalition data for existing users
```

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY
FT_API_CLIENT_ID=42_INTRA_CLIENT_ID
FT_API_CLIENT_SECRET=42_INTRA_CLIENT_SECRET
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Database setup

Run the schema against your Supabase project **after** enabling auth (the schema references `auth.users`):

```bash
# Supabase dashboard → SQL Editor → paste contents of supabase/schema.sql
```

Migrations in `supabase/migrations/` can be applied in order if you need to update an existing database.

### Scheduled jobs (Supabase pg_cron)

| Schedule               | Function              | Purpose                                      |
| ---------------------- | --------------------- | -------------------------------------------- |
| Every day 00:00 UTC    | `reset_daily_claim()` | Resets `claimed_today = false` for all users |
| Every Monday 00:00 UTC | `reset_weekly()`      | Resets `weekly_coins` leaderboard column     |

## 42 Auth setup

The app uses **Supabase Auth with a custom OAuth2 provider** for 42 Intra. Standard GitHub/Google auth is not used.

### Step 1 — Create a 42 Intra application

Go to [intra.42.fr/en/oauth/applications](https://intra.42.fr/en/oauth/applications) and create a new application.

Set the redirect URI to your Supabase project's auth callback:

```text
https://PROJECT_REF.supabase.co/auth/v1/callback
```

### Step 2 — Configure Supabase URL settings

In **Supabase → Authentication → URL Configuration**:

```text
Site URL:      https://your-production-domain.com
               (use http://localhost:3000 for local dev)

Redirect URLs: https://your-production-domain.com/auth/callback
               http://localhost:3000/auth/callback
```

### Step 3 — Register the custom provider

Run the setup script (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`):

```bash
npm run auth:setup42
```

This creates or updates the custom provider with the following values:

```text
Identifier:        custom:42-school
Name:              42 School
Authorization URL: https://api.intra.42.fr/oauth/authorize
Token URL:         https://api.intra.42.fr/oauth/token
Userinfo URL:      https://api.intra.42.fr/v2/me
Scopes:            public
Attribute mapping: sub → email
Email optional:    true
Provider type:     OAuth2
```

## Available scripts

| Script                 | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start Next.js development server                     |
| `npm run build`        | Production build                                     |
| `npm run start`        | Start production server                              |
| `npm run lint`         | Run ESLint                                           |
| `npm run auth:setup42` | Register/update 42 custom OAuth provider in Supabase |

## Deployment

The app is a standard Next.js application and can be deployed to:

- **Vercel** — zero-config, recommended
- **Self-hosted** — Docker container via Coolify or any Node.js host

Set all `.env.local` variables as environment variables in your deployment platform. Update `NEXT_PUBLIC_SITE_URL` and the Supabase redirect URLs to match your production domain.
