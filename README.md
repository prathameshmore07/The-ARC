# THE ARC — Single-Player Life RPG

> **Turn everyday goals into meaningful actions. Build habits, forge capabilities, and see your real-world progress reflected in a dark-fantasy sovereign ledger.**

**THE ARC** is a single-player **Life RPG** where the user is the character and real-world actions are gameplay. Built with **Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and Supabase (Auth & PostgreSQL)**.

---

## ⚔️ Visual Direction & Atmosphere

THE ARC combines **editorial typography, antique gold filigree, and obsidian noir surfaces** inspired by Elden Ring, Dark Souls, and dark-fantasy literature:
- **Obsidian Noir Backgrounds** (`#06090E` / `#080C12`) with fine hairline borders (`#141B24` / `#1E2B3C`).
- **Antique Gold Accents** (`#C5A059`) with ivory typography (`#EDE8DF` / `#F2EEE6`).
- **Restrained Crimson & Emerald** (`#D04A26` / `#3A7F58`) for momentum and completions.
- **Zero cartoon elements, no neon gamification cliches, no arcade sound effects** — a focused, mature, and deeply satisfying developmental environment.

---

## 🏛️ Core Systems & Features

### 1. Multi-Archetype Quest System (Not a Timer App)
A timer is only one execution mechanic. THE ARC supports 6 discrete quest archetypes, each with its own bespoke gameplay console:

| Archetype | Execution Mechanic | Gameplay Console | Completion Requirement |
| :--- | :--- | :--- | :--- |
| **FOCUS** | Duration-based | Countdown timer with server heartbeat tracking | Server-validated duration. Stopping early does not grant rewards and preserves remaining minutes. |
| **DISTANCE** | Distance-based | Live distance gauge, progress bar, increment buttons, pace notes | Distance logged meets or exceeds target (e.g. 3.0 KM). |
| **COUNT** | Quantity-based | Tactile quantity dial with quick `+1`, `+5`, `+10` stepper buttons | Quantity counter reaches target threshold (e.g. 20 Pages). |
| **BUILD** | Outcome/Checkpoints | Deliverable checklist with interactive toggles and artifact links | All discrete milestone checkpoints completed. |
| **ACTION** | Real-world confirmation | Reflection prompt with intentional 2-second hold-to-confirm button | Deliberate hold-to-confirm verified by user. |
| **SKILL** | Practice/Output | Working sets table (sets, reps, load, drill notes) | Deliberate practice session logged and confirmed. |

#### Timer Integrity
- Stopping a Focus quest early shows completed vs. remaining time:
  ```
  18 MIN COMPLETED · 27 MIN REMAINING · [ CONTINUE QUEST ]
  ```
- **Non-Punitive Abandonment**: Users can abandon a session at any time with zero XP loss and zero streak damage.

---

### 2. Comic-Style Celebration Engine
A restrained, confident graphic-novel micro-layer that rewards completion without childish gamification:
- **Typographic Punch**: Dual-layer typography with comic offset drop-shadows (`QUEST COMPLETE`, `DONE.`, `NICE.`, `ASCENDED.`) and angled action stamps (`+20 XP`, `MOMENTUM +8`).
- **Visual Impact**: 48-ray SVG speed-line radial bursts, floating amber embers, and subtle screen rumble on major completions.
- **Web Audio API Sound Synthesizer**: Procedural, zero-dependency audio synthesis generating a deep sub-bass impact thump (sine drop to 30Hz), transient punch snap, and harmonic pentatonic chords.
- **Tiered Intensity**: `LIGHT`, `STANDARD`, `DEMANDING`, `MAJOR`, and `MILESTONE`.

---

### 3. Cinematic Graphic-Novel Onboarding (`/onboarding`)
Brand new users begin with a dramatic narrative prologue instead of a boring survey:
1. **Prologue**: *"THE ARC"* &rarr; *"Every journey begins with a choice."* &rarr; **[ LET'S BEGIN. ]**
2. **Chapter I**: *WHAT DO YOU WANT TO BECOME?* &rarr; **"THEN LET'S BUILD IT."**
3. **Chapter II**: *WHY DOES THIS MATTER?* &rarr; **"NOTED. ANCHOR DROPPED."**
4. **Chapter III**: *HOW WILL YOU GET THERE?* &rarr; **"THE BLUEPRINT TAKES SHAPE."**
5. **Chapter IV**: *HOW MUCH TIME CAN YOU GIVE EACH DAY?* &rarr; **"DISCIPLINE LOCKED."**
6. **The Climax**: Animated radar compass (*"UNDERSTANDING YOUR ARC..."*) &rarr; *"YOUR STORY STARTS HERE."* with personalized archetype dossier and tailored multi-archetype starter quests.

---

### 4. The Armory & Physical Heraldic Badges (`/armory`)
14 unique, high-relief dark fantasy medallions rendered in antique gold and obsidian:
- **Titles**: *The Builder*, *The Consistent*, *The Scholar*, *The Shipper*, *The Ascetic*.
- **Insignias**: *Celestial Compass*, *Aegis of Resolve*, *Seal of the 5K*, *Crest of 30 Days*.
- **Path Marks**: *Mark of the Artisan*, *Mark of the Scholar*, *Mark of the Warrior*.
- **Themes**: *Obsidian Noir*, *Gothic Citadel*.
- **Features**: Rarity tiers (`COMMON` to `LEGENDARY`), philosophical quotes, requirement progression bars, live equip/forge actions, and an **interactive click-to-inspect modal** showcasing full-resolution 3D relief medallion artwork.

---

### 5. Progression Engine & The Living Ledger
- **Non-Linear 20-Level Progression**: Exact logarithmic XP curve from Level 1 (`BEGINNING`) to Level 20 (`COMPLETE`), extending into `THE ARC CONTINUES`.
- **Action &rarr; Attribute Compounding**: Every verified action compounds into 4 core capabilities: **CRAFT**, **BODY**, **MIND**, and **PEOPLE**.
- **Virtual Economy**: Sovereign Marks earned through verified discipline, spendable in The Armory.
- **Non-Shaming Streak System**: 7-day visual glyphs with non-punitive reset philosophy.

---

## 🔒 Security & Architecture (Supabase Only)

```
┌──────────────────────────────────────────────────────────┐
│                   Next.js 16 App Router                  │
│       (/dashboard, /character, /quests, /armory, etc.)   │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
        Server Actions / API        Supabase SSR Auth
        (Archetype Validators,      (Session Verification,
         Integrity Timers)           Token Refresh via Cookies)
                │                          │
┌───────────────▼──────────────────────────▼───────────────┐
│                     Deterministic Engine                 │
│  - Multi-Archetype Validation: Focus, Distance, Count    │
│  - Non-linear Leveling: floor(100 * level^1.5)           │
│  - Streak Engine & Proof-of-Grind anti-cheat             │
└───────────────┬──────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────┐
│              Supabase PostgreSQL Database                │
│    - User.id = auth.uid() (Direct UUID relational match) │
│    - Row Level Security (RLS) on all user-owned tables   │
│    - Connection pooling & direct connection via Prisma   │
└──────────────────────────────────────────────────────────┘
```

- **Authentication**: **Supabase Auth ONLY**. Managed through `@supabase/ssr` cookies and client sessions.
- **Database**: **Supabase PostgreSQL ONLY**. All tables (`User`, `Attribute`, `Task`, `CompletionLog`, `FocusSession`, `ShadowEntity`, `CosmeticItem`, `UserCosmetic`) reside in Supabase with RLS policies (`auth.uid() = "userId"`).

---

## 📦 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4, Obsidian Noir & Antique Gold theme tokens
- **3D & Graphics**: Three.js, React Three Fiber, SVG speed-line procedural filters
- **Sound**: Procedural Web Audio API sound synthesis (zero external audio dependencies)
- **Database & ORM**: PostgreSQL hosted on Supabase via Prisma ORM
- **Authentication**: Supabase SSR Auth (`@supabase/ssr`, `@supabase/supabase-js`)

---

## 🚀 Quickstart & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/prathameshmore07/The-ARC.git
cd The-ARC
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

CRON_SECRET=your-random-cron-secret
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

### 3. Push Database Schema to Supabase
```bash
npx prisma db push
```

Run the Row Level Security (RLS) policies in the **Supabase SQL Editor**:
```sql
-- Located in supabase/rls-policies.sql
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Verification & Tests
```bash
npm test        # Runs 56 Living Ledger & Multi-Archetype unit tests
npm run build   # Validates production compilation across all 27 routes
```

---

## 📄 License

Private & Proprietary. All Rights Reserved. Built for **THE ARC**.
