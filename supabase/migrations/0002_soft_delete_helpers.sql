-- Soft-delete helper functions.
-- v2 lesson #15: hard deletes were unrecoverable. v3 flips deleted_at by default.

-- soft_delete(table, id) — sets deleted_at = now()
CREATE OR REPLACE FUNCTION soft_delete(p_table TEXT, p_id UUID) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET deleted_at = now(), updated_at = now(), updated_by = auth.uid() WHERE id = $1 AND user_id = auth.uid() AND deleted_at IS NULL',
    p_table
  ) USING p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION soft_delete(TEXT, UUID) TO authenticated;

-- restore(table, id) — clears deleted_at
CREATE OR REPLACE FUNCTION restore(p_table TEXT, p_id UUID) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET deleted_at = NULL, updated_at = now(), updated_by = auth.uid() WHERE id = $1 AND user_id = auth.uid() AND deleted_at IS NOT NULL',
    p_table
  ) USING p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION restore(TEXT, UUID) TO authenticated;

-- updated_at maintenance trigger fn (universal). Attach to every mutable table:
--   CREATE TRIGGER trg_updated_at_<table>
--     BEFORE UPDATE ON <table>
--     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  IF auth.uid() IS NOT NULL THEN
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;
