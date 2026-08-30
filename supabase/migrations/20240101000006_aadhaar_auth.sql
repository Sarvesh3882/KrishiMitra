-- Migration: Add aadhaar_last4 to farmer_profiles
-- Aadhaar is used as a familiar identifier for farmers
-- We store only the last 4 digits for display purposes
-- Full Aadhaar number is NEVER stored (privacy/legal compliance)

ALTER TABLE farmer_profiles
  ADD COLUMN IF NOT EXISTS aadhaar_last4 char(4)
    CHECK (aadhaar_last4 ~ '^[0-9]{4}$');

COMMENT ON COLUMN farmer_profiles.aadhaar_last4
  IS 'Last 4 digits of Aadhaar for display only. Full Aadhaar is never stored.';
