-- ============================================================
-- schemes table (cache of government schemes from myScheme.gov.in)
-- ============================================================
CREATE TABLE IF NOT EXISTS schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  eligibility text NOT NULL,
  benefits text NOT NULL,
  required_documents text[] NOT NULL DEFAULT '{}',
  application_process text NOT NULL,
  official_link text NOT NULL,
  source_url text NOT NULL,
  applicable_states text[] NOT NULL DEFAULT '{}',
  applicable_enterprise_types text[] NOT NULL DEFAULT '{}',
  last_fetched timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schemes_states ON schemes USING GIN(applicable_states);
CREATE INDEX IF NOT EXISTS idx_schemes_enterprise_types ON schemes USING GIN(applicable_enterprise_types);
CREATE INDEX IF NOT EXISTS idx_schemes_last_fetched ON schemes(last_fetched);

ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;

-- Public read: any authenticated user can read cached schemes
CREATE POLICY "schemes_select_authenticated" ON schemes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Write restricted to service role (backend upserts)
CREATE POLICY "schemes_insert_service" ON schemes
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "schemes_update_service" ON schemes
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "schemes_delete_service" ON schemes
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================================
-- training_resources table (cache from ICAR/KVK portals)
-- ============================================================
CREATE TABLE IF NOT EXISTS training_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  crop_activity text NOT NULL,
  language text CHECK (language IN ('en', 'hi', 'mr')),
  duration text,
  material_description text NOT NULL,
  source_link text NOT NULL,
  enterprise_type text NOT NULL,
  last_fetched timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_enterprise_type ON training_resources(enterprise_type);
CREATE INDEX IF NOT EXISTS idx_training_language ON training_resources(language);
CREATE INDEX IF NOT EXISTS idx_training_last_fetched ON training_resources(last_fetched);

ALTER TABLE training_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_select_authenticated" ON training_resources
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "training_insert_service" ON training_resources
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "training_update_service" ON training_resources
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "training_delete_service" ON training_resources
  FOR DELETE USING (auth.role() = 'service_role');
