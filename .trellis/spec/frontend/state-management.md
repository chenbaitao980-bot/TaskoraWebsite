# State Management

> No state library. This is a static site — state is managed via vanilla DOM.

## Approach

All interactive state is local to the page via direct DOM manipulation:

- Form state: read from `form.elements.namedItem()`
- UI state: toggle `style.display`, `className`, `disabled` on elements
- No global state, no stores, no signals

## Supabase Connection

All Supabase calls use the same credentials (inlined in `<script>` — publishable keys, safe for client):

```ts
const SUPABASE_URL = 'https://wlehkvsxftyxmxelcaps.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Nz2Ro_4jBthvDwjeQ8m-ww_tT0wYgcF';
```

## Data Flow Patterns

### Pattern 1 — Anonymous write (feedback form)

```ts
await fetch(`${SUPABASE_URL}/rest/v1/user_feedback`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify(data),
});
```

Real example: [`src/pages/feedback.astro`](../../../src/pages/feedback.astro)

### Pattern 2 — Anonymous read (dynamic content, no login required)

Used for content that must update without redeploying (e.g., download links):

```ts
const res = await fetch(`${SUPABASE_URL}/rest/v1/download_links?select=platform,url`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
});
const rows: { platform: string; url: string }[] = await res.json();
```

RLS requirement: table must have `FOR SELECT USING (true)` policy for anon role.

Real example: [`src/pages/download.astro`](../../../src/pages/download.astro)

### Pattern 3 — Supabase Auth login (admin pages)

Login endpoint returns `access_token`; store in `localStorage` for subsequent authenticated requests:

```ts
const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
  body: JSON.stringify({ email, password }),
});
const { access_token } = await res.json();
localStorage.setItem('taskora_admin_token', access_token);
```

### Pattern 4 — Authenticated write (admin update)

Pass `access_token` as `Authorization` Bearer; use PATCH with `?column=eq.value` filter:

```ts
await fetch(`${SUPABASE_URL}/rest/v1/download_links?platform=eq.android_apk`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${localStorage.getItem('taskora_admin_token')}`,
    'Prefer': 'return=minimal',
  },
  body: JSON.stringify({ url: 'https://...' }),
});
```

RLS requirement: table must have `FOR UPDATE USING (auth.role() = 'authenticated')` policy.

Real example: [`src/pages/admin.astro`](../../../src/pages/admin.astro)

## Client-Side Auth Guard Pattern

For pages that require login, check `localStorage` token on page load and redirect immediately if absent:

```ts
const token = localStorage.getItem('taskora_admin_token');
if (!token) {
  window.location.href = '/admin-login';
} else {
  init(token); // proceed with authenticated fetch
}
```

Also handle 401 from Supabase (expired token):

```ts
if (res.status === 401) {
  localStorage.removeItem('taskora_admin_token');
  window.location.href = '/admin-login';
  return;
}
```

Real example: [`src/pages/admin.astro`](../../../src/pages/admin.astro)

## Supabase RLS Policy Reference

| Use case | Policy |
|---|---|
| Public read (anon) | `FOR SELECT USING (true)` |
| Auth-only write | `FOR UPDATE USING (auth.role() = 'authenticated')` |
| Auth-only insert | `FOR INSERT WITH CHECK (auth.role() = 'authenticated')` |

Always enable RLS on tables before deploying: `ALTER TABLE t ENABLE ROW LEVEL SECURITY;`

## Rules

- Do NOT introduce Zustand, Nanostores, or any state library
- Do NOT introduce React or Vue — the project is Astro-only
- For new interactive features, use vanilla DOM + `<script>` blocks following the patterns above
- API keys for public-facing calls (anon key) may be inlined in `<script>` — they are publishable keys intended for client-side use
- Admin `access_token` goes in `localStorage` only — never embed in HTML or commit to git
