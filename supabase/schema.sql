-- ═══════════════════════════════════════════════════════════════
-- THE ARC — Complete Supabase PostgreSQL Schema
-- Copy and run this script in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. User Table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "grit" INT DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attribute Table
CREATE TABLE IF NOT EXISTS "Attribute" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "xp" INT DEFAULT 0,
  "level" INT DEFAULT 1,
  "lastActivityAt" TIMESTAMPTZ DEFAULT NOW(),
  "streak" INT DEFAULT 0,
  "xpBoostUntil" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "Attribute_userId_idx" ON "Attribute"("userId");

-- 3. Task Table
CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "attributeId" TEXT NOT NULL REFERENCES "Attribute"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");
CREATE INDEX IF NOT EXISTS "Task_attributeId_idx" ON "Task"("attributeId");

-- 4. CompletionLog Table
CREATE TABLE IF NOT EXISTS "CompletionLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "taskId" TEXT NOT NULL REFERENCES "Task"("id") ON DELETE CASCADE,
  "xpAwarded" INT NOT NULL,
  "gritAwarded" INT DEFAULT 0,
  "focusVerified" BOOLEAN DEFAULT false,
  "completedAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "CompletionLog_userId_idx" ON "CompletionLog"("userId");
CREATE INDEX IF NOT EXISTS "CompletionLog_taskId_idx" ON "CompletionLog"("taskId");

-- 5. FocusSession Table
CREATE TABLE IF NOT EXISTS "FocusSession" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "taskId" TEXT NOT NULL,
  "startedAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastHeartbeat" TIMESTAMPTZ DEFAULT NOW(),
  "heartbeatCount" INT DEFAULT 0,
  "endedAt" TIMESTAMPTZ,
  "validated" BOOLEAN DEFAULT false,
  "computedDurationSec" INT
);
CREATE INDEX IF NOT EXISTS "FocusSession_userId_idx" ON "FocusSession"("userId");

-- 6. ShadowEntity Table
CREATE TABLE IF NOT EXISTS "ShadowEntity" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "attributeId" TEXT NOT NULL REFERENCES "Attribute"("id") ON DELETE CASCADE,
  "hp" INT DEFAULT 10,
  "baselineWeeklyRate" FLOAT8 DEFAULT 0,
  "stolenXpPool" INT DEFAULT 0,
  "stealRate" FLOAT8 DEFAULT 0.2,
  "sealProgress" INT DEFAULT 0,
  "stepsNeeded" INT DEFAULT 3,
  "manifestedAt" TIMESTAMPTZ DEFAULT NOW(),
  "defeatedAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "ShadowEntity_userId_idx" ON "ShadowEntity"("userId");
CREATE INDEX IF NOT EXISTS "ShadowEntity_attributeId_idx" ON "ShadowEntity"("attributeId");

-- 7. DailySnapshot Table
CREATE TABLE IF NOT EXISTS "DailySnapshot" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "date" TIMESTAMPTZ NOT NULL,
  "totalXp" INT NOT NULL,
  CONSTRAINT "DailySnapshot_userId_date_key" UNIQUE ("userId", "date")
);
CREATE INDEX IF NOT EXISTS "DailySnapshot_userId_idx" ON "DailySnapshot"("userId");

-- 8. CosmeticItem Table
CREATE TABLE IF NOT EXISTS "CosmeticItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "type" TEXT NOT NULL,
  "price" INT NOT NULL,
  "cssClass" TEXT NOT NULL,
  "description" TEXT
);

-- 9. UserCosmetic Table
CREATE TABLE IF NOT EXISTS "UserCosmetic" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "itemId" TEXT NOT NULL REFERENCES "CosmeticItem"("id") ON DELETE CASCADE,
  "equipped" BOOLEAN DEFAULT false,
  "earnedAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "UserCosmetic_userId_itemId_key" UNIQUE ("userId", "itemId")
);
CREATE INDEX IF NOT EXISTS "UserCosmetic_userId_idx" ON "UserCosmetic"("userId");

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security (RLS) Policies
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own data" ON "User"
  FOR ALL USING (auth.uid()::text = "id");

ALTER TABLE "Attribute" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own attributes" ON "Attribute"
  FOR ALL USING (auth.uid()::text = "userId");

ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own tasks" ON "Task"
  FOR ALL USING (auth.uid()::text = "userId");

ALTER TABLE "CompletionLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own completions" ON "CompletionLog"
  FOR ALL USING (auth.uid()::text = "userId");

ALTER TABLE "FocusSession" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own sessions" ON "FocusSession"
  FOR ALL USING (auth.uid()::text = "userId");

ALTER TABLE "ShadowEntity" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own shadows" ON "ShadowEntity"
  FOR ALL USING (auth.uid()::text = "userId");

ALTER TABLE "DailySnapshot" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own snapshots" ON "DailySnapshot"
  FOR ALL USING (auth.uid()::text = "userId");

ALTER TABLE "CosmeticItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read cosmetic items" ON "CosmeticItem"
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE "UserCosmetic" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own cosmetics" ON "UserCosmetic"
  FOR ALL USING (auth.uid()::text = "userId");

-- ═══════════════════════════════════════════════════════════════
-- Starter Cosmetic Items Seed
-- ═══════════════════════════════════════════════════════════════

INSERT INTO "CosmeticItem" ("id", "name", "price", "cssClass", "type", "description")
VALUES
  (gen_random_uuid()::text, 'Cyberpunk Matrix', 100, 'cyberpunk-matrix', 'theme', 'Enter the matrix with acid green.'),
  (gen_random_uuid()::text, 'Crimson Glitch', 150, 'crimson-glitch', 'theme', 'Blood red glitch aesthetic.'),
  (gen_random_uuid()::text, 'Solar Gold', 200, 'solar-gold', 'theme', 'Astral purple and gold royalty.'),
  (gen_random_uuid()::text, 'Entropy Defier', 50, 'badge-entropy-defier', 'badge', 'Survived your first week without decay'),
  (gen_random_uuid()::text, 'Void Walker', 75, 'badge-void-walker', 'badge', 'Banished a Shadow Entity'),
  (gen_random_uuid()::text, 'Chrono Master', 120, 'title-chrono-master', 'title', 'Completed 10 Focus Sessions')
ON CONFLICT ("name") DO UPDATE SET
  "price" = EXCLUDED."price",
  "cssClass" = EXCLUDED."cssClass",
  "type" = EXCLUDED."type",
  "description" = EXCLUDED."description";
