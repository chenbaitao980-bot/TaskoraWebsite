# Research: DB Tables Supabase

- **Query**: 检查 Supabase 中 vip_types、vip_config、discount_codes、recharge_tiers、vip_operation_logs 5 张表是否已建。同时检查 app_config、download_links、payment_orders 现状。
- **Scope**: internal
- **Date**: 2026-06-09

## Findings

### Migrations Found

Only one migration file exists:
- `supabase/migrations/001_member_config.sql`

### Tables Actually Created (from 001_member_config.sql)

| Actual Table Name | Requested Name Match | Status |
|---|---|---|
| `member_types` | `vip_types` ❌ — different name | ✅ Created |
| `member_discount_codes` | `discount_codes` ❌ — different name | ✅ Created |
| `member_recharge_tiers` | `recharge_tiers` ❌ — different name | ✅ Created |
| `member_config_logs` | `vip_operation_logs` ❌ — different name | ✅ Created |

**Note**: The task asks about `vip_types`, `vip_config`, `discount_codes`, `recharge_tiers`, `vip_operation_logs`. None of those exact names exist. The migration uses `member_types`, `member_discount_codes`, `member_recharge_tiers`, `member_config_logs`.

### Table Structures

#### `member_types` (line 5–28)
```
id UUID PK
name TEXT NOT NULL
price NUMERIC(10,2) NOT NULL DEFAULT 0
duration_days INTEGER NOT NULL DEFAULT 30
ai_decompose BOOLEAN NOT NULL DEFAULT true
data_export BOOLEAN NOT NULL DEFAULT true
max_projects INTEGER NOT NULL DEFAULT -1
max_tasks INTEGER NOT NULL DEFAULT -1
auto_renew BOOLEAN NOT NULL DEFAULT false
trial_days INTEGER NOT NULL DEFAULT 0
referral_bonus INTEGER NOT NULL DEFAULT 0
sort_order INTEGER NOT NULL DEFAULT 0
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

#### `member_discount_codes` (line 31–40)
```
id UUID PK
code TEXT NOT NULL UNIQUE
percent INTEGER NOT NULL CHECK (percent BETWEEN 1 AND 100)
type_id UUID REFERENCES member_types(id) ON DELETE SET NULL
active BOOLEAN NOT NULL DEFAULT true
used_count INTEGER NOT NULL DEFAULT 0
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

#### `member_recharge_tiers` (line 43–50)
```
id UUID PK
amount NUMERIC(10,2) NOT NULL
bonus NUMERIC(10,2) NOT NULL DEFAULT 0
sort_order INTEGER NOT NULL DEFAULT 0
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

#### `member_config_logs` (line 53–60)
```
id UUID PK
admin_email TEXT
action TEXT NOT NULL
detail TEXT
payload JSONB
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

### Indexes (line 62–65)
- `idx_member_discount_codes_code` on `member_discount_codes(code)`
- `idx_member_discount_codes_active` on `member_discount_codes(active)`
- `idx_member_config_logs_created_at` on `member_config_logs(created_at DESC)`

### Auto-update Triggers (line 67–89)
- `trigger_member_types_updated_at` — BEFORE UPDATE on `member_types`
- `trigger_member_discount_codes_updated_at` — BEFORE UPDATE on `member_discount_codes`
- `trigger_member_recharge_tiers_updated_at` — BEFORE UPDATE on `member_recharge_tiers`

### RLS Policies (line 91–118)

| Table | Admin Policy | Public Read Policy |
|---|---|---|
| `member_types` | `Admins can manage member types` (role='admin') | `Anyone can read active member types` (always true) |
| `member_discount_codes` | `Admins can manage discount codes` (role='admin') | `Anyone can read active discount codes` (active = true) |
| `member_recharge_tiers` | `Admins can manage recharge tiers` (role='admin') | `Anyone can read recharge tiers` (always true) |
| `member_config_logs` | `Admins can view logs` (role='admin') | ❌ No public read policy |

### Tables NOT Found

| Table | Status |
|---|---|
| `vip_types` | ❌ Not found (use `member_types`) |
| `vip_config` | ❌ Not found |
| `discount_codes` | ❌ Not found (use `member_discount_codes`) |
| `recharge_tiers` | ❌ Not found (use `member_recharge_tiers`) |
| `vip_operation_logs` | ❌ Not found (use `member_config_logs`) |
| `app_config` | ❌ Not found |
| `download_links` | ❌ Not found |
| `payment_orders` | ❌ Not found |
| `user_subscriptions` | ⚠️ Referenced in code (admin script line 251) and Flutter `subscription_service.dart:60`, but NO migration file found |
| `member_subscriptions` | ⚠️ Referenced in admin script `user_count:member_subscriptions(count)` — no migration exists |

### Supabase Project Info
- **URL**: `https://wlehkvsxftyxmxelcaps.supabase.co`
- **Anon key** (hardcoded): `sb_publishable_Nz2Ro_4jBthvDwjeQ8m-ww_tT0wYgcF` (in `members.astro:219` and `app_constants.dart:9`)

## Caveats / Not Found

- **`user_subscriptions` table** is actively queried by both Flutter (`subscription_service.dart:60`) and the admin panel (via `user_count:member_subscriptions(count)` join), but there is **no SQL migration** for it — it may have been created manually or is missing from this repo.
- **`member_subscriptions`** is referenced in admin `loadTypes()` as a subquery for user count — no migration found.
- **No Edge Functions** for member config exist in `supabase/functions/` — only `upload-to-github` exists.
- Table names in existing code (`member_types`, `member_discount_codes`) differ from task naming convention (`vip_types`, `discount_codes`). Admin page and Flutter services use the `member_` prefix consistently.
