# Frontend Integration Patterns

Contracts and gotchas for browser ↔ external service integrations in this project.

---

## Supabase Auth Key Usage

### Scenario: Public (unauthenticated) REST reads

**Correct** — only `apikey` header, no `Authorization`:

```js
const res = await fetch(`${SUPABASE_URL}/rest/v1/download_links?select=platform,url`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,  // sb_publishable_xxx
  },
});
```

**Wrong** — passing publishable key as Bearer token:

```js
// ❌ sb_publishable_xxx is NOT a JWT. Supabase returns 403.
headers: {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
}
```

> **Gotcha**: The new Supabase publishable key format (`sb_publishable_xxx`) is **not a JWT** and cannot be decoded as a Bearer token. Using it as `Authorization: Bearer` causes a 403 even when RLS allows public reads. Only use `Authorization: Bearer <token>` when `token` is an actual Supabase JWT (e.g., from `localStorage.getItem('taskora_admin_token')`).

### Error Matrix

| Header sent | Result |
|---|---|
| `apikey: sb_publishable_xxx` only | ✅ 200, anon role applied |
| `apikey: sb_publishable_xxx` + `Authorization: Bearer sb_publishable_xxx` | ❌ 403 (unparseable JWT) |
| `apikey: sb_publishable_xxx` + `Authorization: Bearer <valid_jwt>` | ✅ 200, authenticated role |

---

## File Upload to External Storage — CORS Constraint

### Scenario: Browser uploads large files (APK, ZIP)

**Problem**: `uploads.github.com` does not allow cross-origin requests from browsers.  
Direct `fetch('https://uploads.github.com/repos/...', { method: 'POST', body: file })` fails with `TypeError: Failed to fetch`.

**Solution**: Supabase Edge Function as server-side proxy.

### Architecture

```
Browser
  │  POST FormData(file, filename, platform)
  │  Authorization: Bearer <admin_jwt>
  ▼
Supabase Edge Function  (upload-to-github)
  │  GITHUB_TOKEN stored as Supabase Secret (never in browser)
  │  Calls api.github.com  →  get/create release
  │  Calls uploads.github.com  →  upload asset
  ▼
GitHub Releases  (chenbaitao980-bot/TaskotaFront, tag v-latest)
  │  returns browser_download_url
  ▼
Browser  PATCH Supabase download_links with URL
```

### Edge Function Contract

**Endpoint**: `POST https://<project-ref>.supabase.co/functions/v1/upload-to-github`

**Request**:
| Field | Type | Location | Notes |
|---|---|---|---|
| `Authorization` | string | header | `Bearer <supabase_admin_jwt>` — required |
| `apikey` | string | header | Supabase anon key |
| `file` | File | FormData | Binary file content |
| `filename` | string | FormData | e.g. `taskora-latest.apk` |
| `platform` | string | FormData | e.g. `android_apk` |

**Response (success)**:
```json
{ "url": "https://github.com/…/releases/download/v-latest/taskora-latest.apk" }
```

**Response (error)**:
```json
{ "error": "<message>" }
```

**Environment secrets required** (set via `supabase secrets set`):
- `GITHUB_TOKEN` — Fine-grained PAT, repo `chenbaitao980-bot/TaskotaFront`, Contents: write

### Validation & Error Matrix

| Condition | HTTP Status | Response |
|---|---|---|
| Missing `Authorization` header | 401 | `{ "error": "Unauthorized" }` |
| Missing `file`, `filename`, or `platform` | 400 | `{ "error": "Missing required fields: …" }` |
| GitHub token invalid/expired | 500 | `{ "error": "Get release failed (401): …" }` |
| GitHub token insufficient permissions | 500 | `{ "error": "Get release failed (403): …" }` |
| Upload succeeds | 200 | `{ "url": "https://…" }` |

### Deployment

```bash
# One-time setup
SUPABASE_ACCESS_TOKEN=<sbp_xxx> supabase link --project-ref <ref>
SUPABASE_ACCESS_TOKEN=<sbp_xxx> supabase secrets set GITHUB_TOKEN=<github_pat_xxx>
SUPABASE_ACCESS_TOKEN=<sbp_xxx> supabase functions deploy upload-to-github --no-verify-jwt
```

> **Note**: `--no-verify-jwt` is used because JWT verification is handled manually in the function (checks `Authorization` header presence). This is sufficient for the admin-only use case.

---

## Vercel Deployment — Do Not Commit `.vercel/output`

> **Gotcha**: If `.vercel/output/` is committed to git, Vercel uses it as pre-built static output and **skips running `npm run build`**. Source changes are ignored until the pre-built files are updated.

**Rule**: `.vercel/output/` must be in `.gitignore`. Never commit build artifacts.

```
# .gitignore (required entries)
dist/
.vercel/output/
```

If the repo accidentally has `.vercel/output` committed, remove it:

```bash
git rm -r --cached .vercel/output/
# add .vercel/output/ to .gitignore
git commit -m "chore: remove pre-built vercel output, let Vercel build fresh"
```

---

## Admin Upload Zone — UX Requirements

When implementing file upload zones in admin pages:

1. **Disable the zone during upload** — add `pointer-events: none; opacity: 0.6` via a CSS class; re-enable in `finally` block
2. **Show progress text** — update `statusEl.textContent` at each step (checking release, uploading, etc.)
3. **Show file size** — `(file.size / 1048576).toFixed(1) MB`
4. **Idempotent overwrite** — delete existing GitHub asset with the same name before uploading
5. **Always re-enable** — use `finally` so the zone is never stuck disabled after an error
