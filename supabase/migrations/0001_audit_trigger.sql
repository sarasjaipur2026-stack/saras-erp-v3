-- Universal audit log + trigger.
-- v2 lesson #14: selective audit logging hid problems. v3 logs every
-- INSERT/UPDATE/DELETE/SOFT_DELETE/RESTORE on every table by default.

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  table_name TEXT NOT NULL,
  row_id UUID NOT NULL,
  op TEXT NOT NULL CHECK (op IN ('INSERT','UPDATE','DELETE','SOFT_DELETE','RESTORE')),
  before JSONB,
  after JSONB,
  diff JSONB,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip INET,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS ix_audit_log_row ON audit_log (table_name, row_id, ts DESC);
CREATE INDEX IF NOT EXISTS ix_audit_log_user ON audit_log (user_id, ts DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_audit_log_ts ON audit_log (ts DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Owner-scoped read; no direct writes (trigger only).
DROP POLICY IF EXISTS "audit_log_owner_read" ON audit_log;
CREATE POLICY "audit_log_owner_read" ON audit_log FOR SELECT USING (user_id = auth.uid());

-- Generic trigger function. Attach to any table:
--   CREATE TRIGGER trg_audit_<table>
--     AFTER INSERT OR UPDATE OR DELETE ON <table>
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_op TEXT;
  v_user_id UUID;
  v_row_id UUID;
  v_before JSONB;
  v_after JSONB;
  v_diff JSONB;
BEGIN
  -- Determine operation type. Soft-delete = UPDATE setting deleted_at non-null.
  IF TG_OP = 'DELETE' THEN
    v_op := 'DELETE';
    v_row_id := OLD.id;
    v_before := to_jsonb(OLD);
    v_user_id := OLD.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_row_id := NEW.id;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    v_user_id := NEW.user_id;
    -- soft-delete vs restore vs plain update
    IF (v_before->>'deleted_at') IS NULL AND (v_after->>'deleted_at') IS NOT NULL THEN
      v_op := 'SOFT_DELETE';
    ELSIF (v_before->>'deleted_at') IS NOT NULL AND (v_after->>'deleted_at') IS NULL THEN
      v_op := 'RESTORE';
    ELSE
      v_op := 'UPDATE';
    END IF;
    -- Compute minimal diff: only changed keys
    v_diff := (
      SELECT jsonb_object_agg(key, jsonb_build_object('from', v_before->key, 'to', v_after->key))
      FROM jsonb_object_keys(v_after) AS key
      WHERE v_before->key IS DISTINCT FROM v_after->key
    );
  ELSE -- INSERT
    v_op := 'INSERT';
    v_row_id := NEW.id;
    v_after := to_jsonb(NEW);
    v_user_id := NEW.user_id;
  END IF;

  INSERT INTO audit_log (user_id, table_name, row_id, op, before, after, diff)
  VALUES (v_user_id, TG_TABLE_NAME, v_row_id, v_op, v_before, v_after, v_diff);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
GRANT EXECUTE ON FUNCTION audit_trigger() TO authenticated;
