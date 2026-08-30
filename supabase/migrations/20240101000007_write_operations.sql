-- Migration: write_operations table
-- Idempotency store for resilient writes.
-- Every important farmer action is registered here before the actual data write.
-- A UNIQUE constraint on operation_id prevents duplicate processing.

CREATE TABLE IF NOT EXISTS write_operations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id     text        NOT NULL,          -- client-generated, e.g. OP-01JABC123XYZ
  user_id          uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  operation_type   text        NOT NULL
                               CHECK (operation_type IN (
                                 'produce_listing',
                                 'local_need',
                                 'farmer_profile',
                                 'chat_history'
                               )),
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'completed', 'failed')),
  payload          jsonb,                         -- full request payload (for audit / retry)
  result_reference text,                          -- e.g. the new record id after success
  error_message    text,                          -- last error if status = failed
  retry_count      int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz,

  -- Core guarantee: one operation_id → one outcome, no duplicates
  CONSTRAINT write_operations_operation_id_unique UNIQUE (operation_id)
);

-- Index for looking up a user's recent operations quickly
CREATE INDEX IF NOT EXISTS idx_write_ops_user
  ON write_operations (user_id, created_at DESC);

-- Index for the resilience dashboard to list recent ops
CREATE INDEX IF NOT EXISTS idx_write_ops_status_created
  ON write_operations (status, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE write_operations ENABLE ROW LEVEL SECURITY;

-- Farmers can see their own operations
CREATE POLICY "write_ops_select_own" ON write_operations
  FOR SELECT USING (auth.uid() = user_id);

-- Farmers can insert operations for themselves
CREATE POLICY "write_ops_insert_own" ON write_operations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role can update (mark completed/failed)
CREATE POLICY "write_ops_update_service" ON write_operations
  FOR UPDATE USING (auth.role() = 'service_role');

-- Service role can read all (for the admin dashboard)
CREATE POLICY "write_ops_select_service" ON write_operations
  FOR SELECT USING (auth.role() = 'service_role');
