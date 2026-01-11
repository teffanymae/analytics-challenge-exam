-- Simple team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending'))
);

-- Basic indexes
CREATE INDEX idx_team_members_admin ON team_members(admin_user_id);
CREATE INDEX idx_team_members_member ON team_members(member_user_id);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Admins can manage their team"
  ON team_members
  FOR ALL
  USING (auth.uid() = admin_user_id);

CREATE POLICY "Members can view their teams"
  ON team_members
  FOR SELECT
  USING (auth.uid() = member_user_id);

-- Update posts RLS for team access
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
CREATE POLICY "Users can view accessible posts"
  ON posts
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.admin_user_id = posts.user_id 
      AND team_members.member_user_id = auth.uid()
      AND team_members.status = 'active'
    )
  );

-- Update daily_metrics RLS for team access
DROP POLICY IF EXISTS "Users can view their own metrics" ON daily_metrics;
CREATE POLICY "Users can view accessible metrics"
  ON daily_metrics
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.admin_user_id = daily_metrics.user_id 
      AND team_members.member_user_id = auth.uid()
      AND team_members.status = 'active'
    )
  );
