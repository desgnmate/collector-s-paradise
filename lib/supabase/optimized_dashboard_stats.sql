-- ============================================
-- OPTIMIZED DASHBOARD STATS FUNCTION
-- ============================================
-- This function calculates all dashboard stats in a single database call
-- Reduces egress by avoiding multiple round-trips and only returning counts

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_vendors', (SELECT COUNT(*) FROM vendors),
    'pending_vendors', (SELECT COUNT(*) FROM vendors WHERE application_status = 'pending'),
    'approved_vendors', (SELECT COUNT(*) FROM vendors WHERE application_status = 'approved'),
    'rejected_vendors', (SELECT COUNT(*) FROM vendors WHERE application_status = 'rejected'),
    'waitlisted_vendors', (SELECT COUNT(*) FROM vendors WHERE application_status = 'waitlisted'),
    'total_events', (SELECT COUNT(*) FROM events),
    'upcoming_events', (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- ============================================
-- ADD INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================
-- These indexes speed up the WHERE clauses used in admin queries

-- Index for filtering by application status (used in pending/approved queries)
CREATE INDEX IF NOT EXISTS idx_vendors_application_status 
ON vendors(application_status);

-- Index for sorting by applied date (used in order by clauses)
CREATE INDEX IF NOT EXISTS idx_vendors_applied_at 
ON vendors(applied_at DESC);

-- Index for business name lookups (used in duplicate check)
CREATE INDEX IF NOT EXISTS idx_vendors_business_name 
ON vendors(business_name);

-- Index for user_id lookups (used in auth relations)
CREATE INDEX IF NOT EXISTS idx_vendors_user_id 
ON vendors(user_id);

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================
-- Run this to confirm indexes exist:
-- SELECT indexname, tablename FROM pg_indexes WHERE tablename = 'vendors';
