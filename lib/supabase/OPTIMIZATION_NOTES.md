# Database Optimization Notes

## Changes Made to Reduce Supabase Egress

### 1. Column Selection Optimization
- **Before:** `select('*')` fetched ALL columns including potentially large fields
- **After:** `select(ADMIN_VENDOR_COLUMNS)` only fetches the 13 columns actually used in the UI
- **Savings:** ~40-60% reduction in data transfer per query

### 2. Dashboard Stats Optimization
- **Before:** 4 separate queries, each with `select('*', { count: 'exact' })`
- **After:** Single RPC call to `get_dashboard_stats()` function
- **Savings:** 75% fewer round-trips, zero data transfer (only counts returned)

### 3. Added Database Indexes
- `idx_vendors_application_status` - Speeds up status filtering
- `idx_vendors_applied_at` - Speeds up sorting by date
- `idx_vendors_business_name` - Speeds up duplicate name checks
- `idx_vendors_user_id` - Speeds up auth relations

### 4. RPC Function Benefits
- Counts calculated server-side (no data transfer)
- Single network round-trip vs 4
- Returns only ~200 bytes vs potentially MBs of data
- SECURITY DEFINER allows counting without row-level security overhead

## Migration Steps
1. Run `lib/supabase/optimized_dashboard_stats.sql` in Supabase SQL Editor
2. Verify function exists: `SELECT proname FROM pg_proc WHERE proname = 'get_dashboard_stats';`
3. Verify indexes: `SELECT indexname FROM pg_indexes WHERE tablename = 'vendors';`

## Monitoring
Check Supabase Dashboard > API > Query stats to verify:
- Reduced response sizes for vendor queries
- Faster dashboard stats response time
- Lower total egress over time
