# Research: API Endpoints Members

- **Query**: 检查 taskora-website/src/pages/api/ 下已有的 Edge Function / API route。特别关注会员配置相关的 API。
- **Scope**: internal
- **Date**: 2026-06-09

## Findings

### Existing API Routes

Only **one** API route file found under `src/pages/api/`:

| File | Method | Description |
|---|---|---|
| `src/pages/api/upload-url.ts` | POST | Generates signed upload URL for app download files |

**`upload-url.ts`** details:
- Validates admin JWT from `Authorization: Bearer` header via Supabase Auth (`/auth/v1/user`)
- Accepts `{ platform: string }` body
- Maps platform to filename: `android_apk` → `taskora-latest.apk`, `windows_zip` → `taskora-latest.zip`
- Creates signed upload URL via Supabase Storage (`/storage/v1/object/upload/sign/downloads/{filename}`)
- Returns `{ signedURL, filename, publicUrl }`
- Uses hardcoded `SERVICE_ROLE_KEY` (line 6)

### Member Config API Routes — NOT FOUND

There are **zero** Astro API routes for member configuration. No files found under `src/pages/api/` for:
- VIP types / member types CRUD
- Discount codes CRUD
- Recharge tiers CRUD
- Operation logs query
- App config
- Download links
- Payment orders

### Admin Page Uses Direct Supabase REST Calls

The admin panel (`src/pages/admin/members.astro` lines 217–843) bypasses Astro API routes entirely. It calls Supabase REST API **directly from the browser** using hardcoded credentials:

```js
// members.astro line 218–219
const SUPABASE_URL = 'https://wlehkvsxftyxmxelcaps.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Nz2Ro_4jBthvDwjeQ8m-ww_tT0wYgcF';
```

Authentication uses admin JWT from `localStorage.getItem('taskora_admin_token')` passed as `Authorization: Bearer {token}`.

### Supabase Edge Functions

Only one Edge Function exists:
- `supabase/functions/upload-to-github/index.ts` — GitHub release upload helper (not member-related)

No Edge Functions exist for:
- `member-config` (called by Flutter `member_config_service.dart:194`)
- `create-order` (called by Flutter `payment_service.dart:31`)
- `order-status` (called by Flutter `payment_service.dart:51`)

### Flutter Client API Calls

| Service | Target | Method |
|---|---|---|
| `MemberConfigService.refresh()` | Supabase Edge Function `member-config` | `GET /functions/v1/member-config` |
| `SubscriptionService.refresh()` | Supabase PostgREST `user_subscriptions` | `SELECT` |
| `PaymentService.createOrder()` | Supabase Edge Function `create-order` | `POST /functions/v1/create-order` |
| `PaymentService.queryOrderStatus()` | Supabase Edge Function `order-status` | `POST /functions/v1/order-status` |

These Edge Functions are **not present** in the `supabase/functions/` directory.

### Admin Panel Direct REST Calls (members.astro)

| Function | URL | Method |
|---|---|---|
| `loadTypes()` | `/rest/v1/member_types?select=*,user_count:member_subscriptions(count)&order=sort_order.asc` | GET |
| `saveType()` (create) | `/rest/v1/member_types` | POST |
| `saveType()` (update) | `/rest/v1/member_types?id=eq.{id}` | PATCH |
| `deleteType()` | `/rest/v1/member_types?id=eq.{id}` | DELETE |
| `loadDiscounts()` | `/rest/v1/member_discount_codes?select=*&order=created_at.desc` | GET |
| `saveDiscount()` (create) | `/rest/v1/member_discount_codes` | POST |
| `saveDiscount()` (update) | `/rest/v1/member_discount_codes?id=eq.{id}` | PATCH |
| `deleteDiscount()` | `/rest/v1/member_discount_codes?id=eq.{id}` | DELETE |
| `loadTiers()` | `/rest/v1/member_recharge_tiers?select=*&order=sort_order.asc,amount.asc` | GET |
| `saveTier()` (create) | `/rest/v1/member_recharge_tiers` | POST |
| `saveTier()` (update) | `/rest/v1/member_recharge_tiers?id=eq.{id}` | PATCH |
| `deleteTier()` | `/rest/v1/member_recharge_tiers?id=eq.{id}` | DELETE |
| `logOperation()` | `/rest/v1/member_config_logs` | POST |
| `loadLogs()` | `/rest/v1/member_config_logs?select=*&order=created_at.desc&limit=50` | GET |

## Caveats / Not Found

- **No member config API routes** exist under `src/pages/api/` — the admin page uses direct Supabase REST calls from client-side JS.
- **Flutter Edge Functions** (`member-config`, `create-order`, `order-status`) are referenced in Flutter code but **not deployed** in this repo's `supabase/functions/`.
- **`user_subscriptions`** table used by Flutter has no migration file.
- The `upload-url.ts` is the only existing API route; all member config interactions happen serverlessly via direct Supabase REST from the browser.
