-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Placement Tracking Enhancements
-- ============================================================================
-- Functions to track placement metrics on agency subscriptions
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- INCREMENT AGENCY PLACEMENTS COUNT
-- ============================================================================
-- Called when a placement is confirmed to update the subscription usage

CREATE OR REPLACE FUNCTION increment_agency_placements(p_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE agency_subscriptions
  SET
    placements_count = placements_count + 1,
    updated_at = now()
  WHERE agency_id = p_agency_id;

  -- If no subscription exists, that's okay - agency might be on implicit free tier
  IF NOT FOUND THEN
    -- Optionally create a free tier subscription for the agency
    INSERT INTO agency_subscriptions (agency_id, plan_id, status, placements_count)
    SELECT
      p_agency_id,
      (SELECT id FROM subscription_plans WHERE slug = 'free' LIMIT 1),
      'active',
      1
    ON CONFLICT (agency_id) DO UPDATE
    SET placements_count = agency_subscriptions.placements_count + 1,
        updated_at = now();
  END IF;
END;
$$;

-- ============================================================================
-- RESET AGENCY USAGE COUNTS (for billing period resets)
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_agency_usage(p_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE agency_subscriptions
  SET
    placements_count = 0,
    updated_at = now()
  WHERE agency_id = p_agency_id;
END;
$$;

-- ============================================================================
-- GET AGENCY BILLING SUMMARY
-- ============================================================================
-- Returns comprehensive billing info for an agency

CREATE OR REPLACE FUNCTION get_agency_billing_summary(p_agency_id uuid)
RETURNS TABLE (
  plan_name text,
  plan_slug text,
  billing_cycle text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  placements_count integer,
  pending_fees_count bigint,
  pending_fees_amount bigint,
  placement_fee_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.name as plan_name,
    sp.slug as plan_slug,
    COALESCE(sub.billing_cycle, 'monthly') as billing_cycle,
    COALESCE(sub.status, 'active') as status,
    sub.current_period_start,
    sub.current_period_end,
    COALESCE(sub.placements_count, 0) as placements_count,
    (SELECT COUNT(*) FROM placement_fees pf WHERE pf.agency_id = p_agency_id AND pf.status = 'pending') as pending_fees_count,
    (SELECT COALESCE(SUM(platform_fee), 0) FROM placement_fees pf WHERE pf.agency_id = p_agency_id AND pf.status = 'pending') as pending_fees_amount,
    sp.placement_fee_percent
  FROM agency_subscriptions sub
  JOIN subscription_plans sp ON sub.plan_id = sp.id
  WHERE sub.agency_id = p_agency_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_agency_placements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_agency_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agency_billing_summary(uuid) TO authenticated;
