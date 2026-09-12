# Entropy Engine — Life RPG

> **Fight the void. Your stats don't just grow — they decay if neglected, spawning a living Shadow that steals your future grind.**

Built for **Tech Zephyr 4.0 (Life RPG Problem Statement)** using **Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, Prisma ORM, and Supabase (Auth, Postgres, Realtime, pg_cron)**.

---

## ⚔️ The Core Innovation: The Shadow Entity (Debt-as-Entity System)

Most gamified productivity apps are pure positive reinforcement: *check a box → get XP*. But psychological research demonstrates that **loss aversion is 2-3× stronger than reward anticipation**.

While other teams build simple countdown bars where "numbers quietly tick down," **Entropy Engine personifies stat neglect as an opposing boss entity**:

1. **Manifestation**: Neglecting an attribute for > 48 hours spawns a `ShadowEntity` with HP that scales the longer it is left unattended. Visually, a glitching dark silhouette creeps onto the attribute card.
2. **Parasitic XP Steal**: Active Shadows steal **20% of all future XP** earned on that attribute. Neglect doesn't just subtract past points — it actively corrupts your future grind until banished.
3. **Structured Boss Fight (Banishing Quest)**: Shadows cannot be banished with quick checkbox clicks. Banishing requires **3 to 6 consecutive Proof-of-Grind focus sessions** with server-verified heartbeats.
4. **Permanent Spoils of War**: Defeating a Shadow triggers a boss-defeat burst animation, awards a permanent commemorative **"Scar" cosmetic badge** to your profile, and grants a **+10% XP surge for 48 hours** ("post-battle resolve") as a comeback mechanic.
5. **Ghost Rival**: A real-time comparative mirror charting your current week's XP velocity against your past week's trajectory.

---

## 🏛️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Next.js 14 App Router                  │
│       (Dashboard, Character HUD, Task Board, Shop)       │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
        Server Actions / API        Supabase Realtime
        (Proof-of-Grind Timer,      (Live Shadow updates)
         Decay Cron, Shop)                 │
                │                          │
┌───────────────▼──────────────────────────▼───────────────┐
│                     Deterministic Engine                 │
│  - Non-linear Leveling: floor(100 * level^1.5)           │
│  - Entropy Decay: 5%/day overdue, floored at 0           │
│  - Anti-Cheat: Heartbeat duration computation only       │
│  - Shadow Scaler: stepsNeeded = min(3 + floor(hp/50), 6) │
└───────────────┬──────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────┐
│              Supabase PostgreSQL Database                │
│    - Row Level Security (RLS) on all user-owned tables   │
│    - User.id = auth.uid() (Direct UUID relational match) │
│    - pg_cron daily decay execution                       │
│    - Type-safe access via Prisma ORM                     │
└──────────────────────────────────────────────────────────┘
```

---

## 🔒 Defense-in-Depth & Anti-Cheat

- **Server-Authoritative Focus Timers**: Client-reported session end times are stored for audit logging only. The server calculates rewards exclusively from `validatedHeartbeatCount * 30s` using a 25–35s timing window. Spoofing timestamps or faking session durations awards zero XP.
- **Supabase Row Level Security (RLS)**: Database tables enforce `auth.uid() = userId` at the Postgres engine level. Even if an attacker bypasses the client or app layer, cross-user data tampering is blocked at the database boundary.
- **Service Role Cron Exclusivity**: Automated decay jobs execute exclusively with `SUPABASE_SERVICE_ROLE_KEY` and are protected with a `Bearer CRON_SECRET` authorization header.
- **Gated Demo Mode**: The judge time-leap control bar is strictly gated behind `DEMO_MODE=true` and `NODE_ENV=development`.

---

## 📊 Core Game Algorithms

| System | Mathematical Formula | Behavior |
|---|---|---|
| **Level Threshold** | `xpForLevel(n) = Math.floor(100 * Math.pow(n, 1.5))` | Non-linear XP curve. Level increments in a loop if threshold is passed. |
| **Entropy Decay** | `floor(xp * 0.05 * overdueDays)` | Kicks in after 48h inactivity. Floored at 0, never reduces level retroactively. |
| **Shadow HP Growth** | `hp += 10 * overdueDays` | Neglected attributes grow stronger Shadows over time. |
| **Banishment Steps** | `min(3 + Math.floor(hp / 50), 6)` | Longer-neglected stats require tougher 3–6 step focus boss fights to banish. |
| **Streaks** | `diffDays === 1 ? streak + 1 : (diffDays === 0 ? streak : 1)` | Increments on consecutive days; resets if a calendar day is skipped. |

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Node.js 18+ (Tested on Node 22)
- Supabase account (free tier)

### 2. Clone and Install
```bash
git clone <your-repo-url>
cd entropy-engine
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
CRON_SECRET=super-secret-cron-token
DEMO_MODE=true
```

### 4. Push Database Schema & Apply RLS
```bash
# Push Prisma schema to your Supabase PostgreSQL database
npx prisma db push

# Seed the default cosmetic catalog (themes, badges, titles)
npm run seed
```

Then, in your **Supabase Dashboard → SQL Editor**, run `supabase/rls-policies.sql` to apply Row Level Security.

### 5. Run the Automated Test Suite
```bash
npm test
```
Verifies all 6 core game algorithms: leveling curves, decay math, streak transitions, Shadow steal rates, and heartbeat anti-cheat validation.

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎬 Recommended 90-Second Demo Video Flow

1. **Landing & Signup (0:00 - 0:15)**: Visit landing page, sign up with email and codename. Lands on Dashboard with 4 initialized attributes (Intellect, Strength, Discipline, Creativity).
2. **Quest Creation & Proof-of-Grind Timer (0:15 - 0:40)**: Add a quest "Leetcode Hard Practice" tagged to Intellect. Launch the Focus Session. Show the pulsing SVG ring and real-time heartbeat counter ticking up. End session and show XP and Grit awarded.
3. **Triggering Entropy Decay & Shadow Spawn (0:40 - 1:05)**: Use the bottom Judge Demo Control Bar to simulate "3 Days Inactivity". Click "Simulate Decay". Watch the Intellect card turn into a decaying state and manifest a menacing **Shadow Entity** stealing 20% of future XP!
4. **Banishing the Shadow & Spoils (1:05 - 1:25)**: Launch verified focus quests to advance the banishing seal (`1/3` → `2/3` → `3/3`). Defeat the Shadow: observe the boss-kill celebration, the awarded **Scar Badge**, and the +10% XP surge boost.
5. **The Void Market & Persistence (1:25 - 1:45)**: Open the Grit Shop, purchase and equip the "Cyberpunk Matrix" theme (instant live theme switch). Hard refresh the browser to prove 100% database persistence.

---

## 📦 Tech Stack & Packages

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Glassmorphism, Theme Variables
- **Animations**: Framer Motion 13
- **Database & ORM**: PostgreSQL via Prisma ORM 6
- **Auth & Realtime**: Supabase SSR Auth, Supabase Realtime Channels
- **Anti-Cheat**: Cryptographic server timestamping & heartbeat delta reconciliation
