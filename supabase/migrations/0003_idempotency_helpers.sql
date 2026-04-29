-- Idempotency helper. Used by every mutation RPC to make retries safe.
-- v2 lesson #11 generalised: every transactional table has an idempotency_key
-- column with a partial unique index when not null.

-- check_idempotency(table, key) returns existing row id (uuid) or NULL.
-- RPCs call this first; if it returns non-null, return that id without doing
-- the mutation again.
CREATE OR REPLACE FUNCTION check_idempotency(p_table TEXT, p_idempotency_key UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_idempotency_key IS NULL THEN RETURN NULL; END IF;
  EXECUTE format(
    'SELECT id FROM %I WHERE user_id = auth.uid() AND idempotency_key = $1 LIMIT 1',
    p_table
  ) INTO v_id USING p_idempotency_key;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION check_idempotency(TEXT, UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION check_idempotency(TEXT, UUID) FROM anon;
