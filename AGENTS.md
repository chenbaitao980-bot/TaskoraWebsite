<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->

## What this is

**Taskora Website** — a documentation / landing site for an AI task-management app called Taskora. Built with **Astro + Starlight**, Chinese-first content.

This is NOT the Taskora app itself. The site documents features, provides download links, and has a simple admin panel for managing those links.

## Stack

- Astro v6 + `@astrojs/starlight` docs theme
- Tailwind CSS v4 (via `@tailwindcss/vite` Vite plugin, **not** PostCSS)
- TypeScript (strict via `astro/tsconfigs/strict`)
- Supabase (download link CRUD, anon key hardcoded in client-side `<script>` blocks)

## Commands

```
npm run dev      # dev server at http://localhost:4321
npm run build    # production output to ./dist/
npm run preview  # preview the built site
npm run astro    # CLI: astro add, astro check, etc.
```

Windows batch helpers in project root: `dev.bat`, `build-check.bat`, `deploy.bat`.

No test, lint, or type-check commands configured.

## Content architecture

- **`src/content/docs/`** — Starlight doc pages (MDX), all Chinese (`zh-CN`). `index.mdx` is the splash homepage.
- **`src/pages/`** — Custom Astro pages outside Starlight routing: `download.astro`, `admin.astro`, `admin-login.astro`, `feedback.astro`.
- **`src/styles/global.css`** — Tailwind import + design tokens (warm coral theme, `--color-primary: #C15F3C`) under `@theme`.
- **`src/components/`** — Currently empty; place Astro `.astro` components here.

## Deployment

Two independent paths:
1. **Vercel** — `vercel.json` defines `npm run build` → `dist/`. `deploy.bat` pushes to `pbtcbt/TaskoraWebsite` which auto-deploys.
2. **GitHub Pages** — `.github/workflows/deploy.yml` builds and deploys via `actions/deploy-pages`.

## Supabase (admin/download pages)

- Project URL: `https://wlehkvsxftyxmxelcaps.supabase.co`
- ANON key hardcoded in client scripts in `admin.astro` and `download.astro`.
- Table: `download_links` (columns: `platform`, `url`).
- Admin auth: JWT stored in `localStorage` as `taskora_admin_token`; login at `/admin-login`.
- **Do not add new hardcoded credentials.** If editing auth or backend logic, move secrets to env vars or server endpoints.

## Trellis spec

`.trellis/spec/frontend/` contains detailed guidelines for this project:
- `component-guidelines.md`, `directory-structure.md`, `hook-guidelines.md`, `type-safety.md`, `state-management.md`, `quality-guidelines.md`.
- Read `index.md` first for the pre-development checklist before writing code.
