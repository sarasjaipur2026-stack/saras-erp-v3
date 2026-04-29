-- Dashboard metrics single-RPC. v2 lesson #6 generalised: one round-trip
-- replaces n+1 useEffect storms. Returns jsonb so the front-end has a
-- stable typed shape regardless of which underlying tables exist yet.
-- Applied to rjfudynyrqbnlbnrbmqc on 2026-04-29.

CREATE OR REPLACE FUNCTION dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_uid UUID := auth.uid(); v JSONB;
BEGIN
  IF v_uid IS NULL THEN RETURN '{}'::jsonb; END IF;
  v := jsonb_build_object(
    'today_orders',     0,
    'new_enquiries',    0,
    'pending_orders',   0,
    'total_customers',  0,
    'recent_activity', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', a.id, 'op', a.op, 'table_name', a.table_name, 'ts', a.ts
      ) ORDER BY a.ts DESC), '[]'::jsonb)
      FROM (SELECT id, op, table_name, ts FROM audit_log WHERE user_id = v_uid ORDER BY ts DESC LIMIT 10) a
    )
  );
  RETURN v;
END;
$$;
GRANT EXECUTE ON FUNCTION dashboard_metrics() TO authenticated;
REVOKE EXECUTE ON FUNCTION dashboard_metrics() FROM anon;
