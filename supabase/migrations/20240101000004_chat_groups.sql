-- ============================================================
-- chat_history
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  language text CHECK (language IN ('en', 'hi', 'mr')),
  query_context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_farmer ON chat_history(farmer_id, created_at DESC);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_history_select_own" ON chat_history
  FOR SELECT USING (farmer_id IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "chat_history_insert_own" ON chat_history
  FOR INSERT WITH CHECK (farmer_id IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- groups (WhatsApp group directory)
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  enterprise_type text NOT NULL,
  state text,
  district text,
  join_link text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_enterprise_type ON groups(enterprise_type);
CREATE INDEX IF NOT EXISTS idx_groups_location ON groups(state, district);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_select_authenticated" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "groups_insert_service" ON groups
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "groups_update_service" ON groups
  FOR UPDATE USING (auth.role() = 'service_role');
