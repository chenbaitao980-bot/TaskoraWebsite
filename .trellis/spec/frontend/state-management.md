# State Management

> No state library. This is a static site — state is managed via vanilla DOM.

## Approach

All interactive state is local to the page via direct DOM manipulation:

- Form state: read from `form.elements.namedItem()`
- UI state: toggle `style.display`, `className`, `disabled` on elements
- No global state, no stores, no signals

## Data Flow

The only external data call is Supabase REST API (feedback form in `src/pages/feedback.astro`):

```ts
const resp = await fetch(`${SUPABASE_URL}/rest/v1/user_feedback`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify(data),
});
```

## Rules

- Do NOT introduce Zustand, Nanostores, or any state library
- Do NOT introduce React or Vue — the project is Astro-only
- For new interactive features, use vanilla DOM + `<script>` blocks following the feedback page pattern
- API keys for public-facing calls (like Supabase anon key) may be inlined in `<script>` — they are publishable keys intended for client-side use
