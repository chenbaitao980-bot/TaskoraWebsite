# Research: Admin Members Script Analysis

- **Query**: 深入分析 taskora-website/src/pages/admin/members.astro 的 <script> 部分（约 800 行 JS），列出已实现的 API 调用函数、Supabase REST 调用 URL、TODO/硬编码、操作日志状态
- **Scope**: internal
- **Date**: 2026-06-09

## Findings

### Script Scope
`src/pages/admin/members.astro` lines 217–843 (627 lines of JS within `<script>` tag)

### Hardcoded Credentials (lines 218–219)

```js
const SUPABASE_URL = 'https://wlehkvsxftyxmxelcaps.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Nz2Ro_4jBthvDwjeQ8m-ww_tT0wYgcF';
```
⚠️ The anon key and URL are embedded directly in the client-side script.

### Authentication
Admin JWT token retrieved from `localStorage.getItem('taskora_admin_token')` and passed as `Authorization: Bearer {token}`. On 401, redirects to `/admin-login` and clears the token.

---

## API Call Functions — Member Types

### `loadTypes(token)` — lines 239–312
**URL**: `GET /rest/v1/member_types?select=*,user_count:member_subscriptions(count)&order=sort_order.asc`
- Joins with `member_subscriptions` (via RPC/subquery `user_count:member_subscriptions(count)`) to get user count per type
- Uses `member_subscriptions` table (no migration file found for this table)

### `saveType()` (form submit handler) — lines 349–420
**URL (create)**: `POST /rest/v1/member_types`
**URL (update)**: `PATCH /rest/v1/member_types?id=eq.{id}`
- Uses `Prefer: return=representation` header
- After save, calls `logOperation()` then `loadTypes()`

### `deleteType(token, id)` — lines 422–440
**URL**: `DELETE /rest/v1/member_types?id=eq.{id}`
- Checks `user_count > 0` before allowing deletion (alert: "无法删除：该类型仍有 N 个活跃用户")

---

## API Call Functions — Discount Codes

### `loadDiscounts(token)` — lines 452–523
**URL**: `GET /rest/v1/member_discount_codes?select=*&order=created_at.desc`

### `saveDiscount()` (form submit handler) — lines 550–605
**URL (create)**: `POST /rest/v1/member_discount_codes`
**URL (update)**: `PATCH /rest/v1/member_discount_codes?id=eq.{id}`

### `deleteDiscount()` (inline in loadDiscounts button handler) — lines 502–515
**URL**: `DELETE /rest/v1/member_discount_codes?id=eq.{id}`
- No confirmation of user count before deletion (unlike types)

---

## API Call Functions — Recharge Tiers

### `loadTiers(token)` — lines 615–680
**URL**: `GET /rest/v1/member_recharge_tiers?select=*&order=sort_order.asc,amount.asc`

### `saveTier()` (form submit handler) — lines 706–759
**URL (create)**: `POST /rest/v1/member_recharge_tiers`
**URL (update)**: `PATCH /rest/v1/member_recharge_tiers?id=eq.{id}`

### `deleteTier()` (inline in loadTiers button handler) — lines 660–673
**URL**: `DELETE /rest/v1/member_recharge_tiers?id=eq.{id}`
- Simple `confirm()` dialog before delete

---

## API Call Functions — Operation Logs

### `logOperation(token, action, detail, payload)` — lines 762–776
**URL**: `POST /rest/v1/member_config_logs`
```js
body: JSON.stringify({ action, detail, payload })
```
- `admin_email` is NOT set in the payload — it is `null` in the database
- Errors are silently caught and ignored

### `loadLogs(token)` — lines 778–833
**URL**: `GET /rest/v1/member_config_logs?select=*&order=created_at.desc&limit=50`
- Limits to 50 most recent entries
- Uses `ACTION_LABELS` map (lines 804–814) to translate action codes to Chinese

---

## TODO / Hardcoded Items

| Location | Issue |
|---|---|
| Line 219 | Hardcoded `SUPABASE_ANON_KEY` in client-side JS |
| Line 219 | Hardcoded `SUPABASE_URL` in client-side JS |
| `logOperation()` line 771 | `admin_email` not set — always `null` in DB |
| `loadTypes()` line 251 | References `member_subscriptions` table — no migration exists |
| Line 251 | `user_count:member_subscriptions(count)` is a Supabase join syntax — requires `member_subscriptions` table with FK to `member_types` |
| Lines 804–814 | `ACTION_LABELS` only covers 9 actions; no `login`/`logout`/`config_change` actions |
| No pagination | `loadLogs()` loads all 50 at once, no page/offset support |
| No search/filter | No search or filter for types/discounts/tiers/logs |
| No bulk delete | No multi-select delete |

### No TODO Comments Found

The script contains **zero** `TODO` or `FIXME` comments. The code is production-complete as written, but with the limitations noted above.

---

## Summary of All Supabase REST Calls

| Function | Method | Table | Notes |
|---|---|---|---|
| `loadTypes` | GET | `member_types` | + `member_subscriptions` join |
| `saveType` (create) | POST | `member_types` | |
| `saveType` (update) | PATCH | `member_types` | `id=eq.{id}` |
| `deleteType` | DELETE | `member_types` | `id=eq.{id}` |
| `loadDiscounts` | GET | `member_discount_codes` | |
| `saveDiscount` (create) | POST | `member_discount_codes` | |
| `saveDiscount` (update) | PATCH | `member_discount_codes` | `id=eq.{id}` |
| `deleteDiscount` | DELETE | `member_discount_codes` | `id=eq.{id}` |
| `loadTiers` | GET | `member_recharge_tiers` | |
| `saveTier` (create) | POST | `member_recharge_tiers` | |
| `saveTier` (update) | PATCH | `member_recharge_tiers` | `id=eq.{id}` |
| `deleteTier` | DELETE | `member_recharge_tiers` | `id=eq.{id}` |
| `logOperation` | POST | `member_config_logs` | admin_email always null |
| `loadLogs` | GET | `member_config_logs` | limit=50 |

### Implementation Status

| Feature | Status |
|---|---|
| Member Types CRUD | ✅ Fully implemented |
| Discount Codes CRUD | ✅ Fully implemented |
| Recharge Tiers CRUD | ✅ Fully implemented |
| Operation Logs write | ✅ Implemented (admin_email null) |
| Operation Logs read | ✅ Implemented (limit 50) |
| Admin auth | ✅ JWT from localStorage |
| Error handling | ⚠️ 401 redirects OK; other errors show alert |
| Pagination | ❌ Not implemented |
| Search/Filter | ❌ Not implemented |
| Bulk operations | ❌ Not implemented |
| member_subscriptions table | ⚠️ Used but no migration file found |
