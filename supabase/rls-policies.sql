-- ═══════════════════════════════════════════════════════════════
-- Entropy Engine — Row Level Security Policies
-- Run this in Supabase SQL Editor after Prisma migrations
-- ═══════════════════════════════════════════════════════════════

-- Note: The "User" table uses auth.uid() as its primary key directly,
-- so all child tables' user_id columns match auth.uid() without joins.

-- Attributes
ALTER TABLE "Attribute" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own attributes" ON "Attribute"
  FOR ALL USING (auth.uid()::text = "userId");

-- Tasks
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own tasks" ON "Task"
  FOR ALL USING (auth.uid()::text = "userId");

-- Completion Logs
ALTER TABLE "CompletionLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own completions" ON "CompletionLog"
  FOR ALL USING (auth.uid()::text = "userId");

-- Focus Sessions
ALTER TABLE "FocusSession" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own sessions" ON "FocusSession"
  FOR ALL USING (auth.uid()::text = "userId");

-- Shadow Entities
ALTER TABLE "ShadowEntity" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own shadows" ON "ShadowEntity"
  FOR ALL USING (auth.uid()::text = "userId");

-- Daily Snapshots
ALTER TABLE "DailySnapshot" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own snapshots" ON "DailySnapshot"
  FOR ALL USING (auth.uid()::text = "userId");

-- User Cosmetics
ALTER TABLE "UserCosmetic" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own cosmetics" ON "UserCosmetic"
  FOR ALL USING (auth.uid()::text = "userId");

-- Cosmetic Items (read-only for all authenticated users)
ALTER TABLE "CosmeticItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read cosmetic items" ON "CosmeticItem"
  FOR SELECT USING (auth.role() = 'authenticated');

-- User table (users can only read/update their own row)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own data" ON "User"
  FOR ALL USING (auth.uid()::text = "id");
