-- ============================================================
-- produce_listings
-- ============================================================
CREATE TABLE IF NOT EXISTS produce_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  product text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  quality_grade text,
  expected_price numeric CHECK (expected_price >= 0),
  available_from date NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  taluka text,
  latitude double precision,
  longitude double precision,
  pickup_delivery text CHECK (pickup_delivery IN ('pickup', 'delivery', 'both')),
  photo_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produce_listings_product ON produce_listings(product);
CREATE INDEX IF NOT EXISTS idx_produce_listings_location ON produce_listings(state, district);
CREATE INDEX IF NOT EXISTS idx_produce_listings_status ON produce_listings(status);
CREATE INDEX IF NOT EXISTS idx_produce_listings_farmer ON produce_listings(farmer_id);

CREATE TRIGGER produce_listings_updated_at
  BEFORE UPDATE ON produce_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE produce_listings ENABLE ROW LEVEL SECURITY;

-- Active listings visible to all authenticated users
CREATE POLICY "produce_listings_select_active" ON produce_listings
  FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

-- Farmers can also see their own listings (all statuses)
CREATE POLICY "produce_listings_select_own" ON produce_listings
  FOR SELECT USING (farmer_id IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "produce_listings_insert_own" ON produce_listings
  FOR INSERT WITH CHECK (farmer_id IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "produce_listings_update_own" ON produce_listings
  FOR UPDATE USING (farmer_id IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "produce_listings_delete_own" ON produce_listings
  FOR DELETE USING (farmer_id IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- buyer_requirements (pre-seeded for prototype)
-- ============================================================
CREATE TABLE IF NOT EXISTS buyer_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product text NOT NULL,
  quantity_needed numeric NOT NULL CHECK (quantity_needed > 0),
  unit text NOT NULL,
  quality_grade text,
  price_range_min numeric CHECK (price_range_min >= 0),
  price_range_max numeric CHECK (price_range_max >= 0),
  required_by date NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  contact_method text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_requirements_product ON buyer_requirements(product);
CREATE INDEX IF NOT EXISTS idx_buyer_requirements_location ON buyer_requirements(state, district);
CREATE INDEX IF NOT EXISTS idx_buyer_requirements_status ON buyer_requirements(status);

ALTER TABLE buyer_requirements ENABLE ROW LEVEL SECURITY;

-- Active requirements visible to authenticated users
CREATE POLICY "buyer_requirements_select_active" ON buyer_requirements
  FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

-- Write via service role only
CREATE POLICY "buyer_requirements_insert_service" ON buyer_requirements
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "buyer_requirements_update_service" ON buyer_requirements
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================
-- local_needs
-- ============================================================
CREATE TABLE IF NOT EXISTS local_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  need_type text NOT NULL CHECK (need_type IN ('shortage', 'surplus', 'alert')),
  title text NOT NULL,
  description text,
  state text NOT NULL,
  district text NOT NULL,
  taluka text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_local_needs_location ON local_needs(state, district);
CREATE INDEX IF NOT EXISTS idx_local_needs_status ON local_needs(status);

ALTER TABLE local_needs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "local_needs_select_active" ON local_needs
  FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

CREATE POLICY "local_needs_insert_own" ON local_needs
  FOR INSERT WITH CHECK (posted_by IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "local_needs_update_own" ON local_needs
  FOR UPDATE USING (posted_by IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  ));
