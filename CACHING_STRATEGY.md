# Admin Panel Caching Strategy

## Overview
Implemented intelligent client-side caching to minimize Supabase egress costs while keeping data fresh.

## Cache Durations
| Data Type | Cache Duration | Refresh Trigger |
|-----------|---------------|-----------------|
| Dashboard Stats | 5 minutes | Manual refresh or after vendor actions |
| Vendor Data | 2 minutes | Manual refresh or after status changes |

## How It Works

### 1. First Visit
- Fetches data from Supabase once
- Stores in React context (in-memory cache)
- Records timestamp in `lastFetchedAt`

### 2. Subsequent Navigation
- Checks if cache is still valid (< duration)
- If valid: Uses cached data instantly (NO database request)
- If expired: Fetches fresh data in background

### 3. After Actions (Approve/Reject/Waitlist)
- Updates local state immediately (optimistic UI)
- Invalidates stats cache (sets timestamp to 0)
- Next dashboard visit will fetch fresh stats

### 4. Manual Refresh
- Header "Refresh" button forces fresh fetch
- Shows loading spinner during refresh
- Updates all caches

## Egress Savings

### Before Caching
- Every navigation = database query
- 10 navigation clicks = 10 queries
- Dashboard refresh on every visit

### After Caching
- First visit = 1 query
- Next 5 minutes = 0 queries (uses cache)
- Only manual refresh or cache expiry triggers new query
- **Estimated savings: 80-90% reduction in database requests**

## Files Modified
- `contexts/AdminDataContext.tsx` - Cache state management
- `components/DashboardContent.tsx` - Uses cached stats
- `app/admin/vendors/AdminVendorsClient.tsx` - Uses cached vendors
- `components/AdminHeader.tsx` - Refresh button with cache info
- `app/admin/layout.tsx` - Includes header
- `app/globals.css` - Header & refresh button styles

## Cache Indicators
- Header shows "Stats updated: HH:MM AM/PM"
- Refresh button shows spinner when loading
- Data displays instantly from cache on navigation
