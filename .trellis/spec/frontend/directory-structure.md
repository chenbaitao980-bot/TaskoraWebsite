# Directory Structure

> Astro + Starlight static site — no React/Vue components.

## Directory Layout

```
src/
  pages/            # Custom non-doc Astro pages (download.astro, feedback.astro)
  content/
    docs/           # Starlight content collection root
      docs/         # Actual docs files (nested to produce "docs/*" slugs)
        features/   # Feature sub-pages
      index.mdx     # Homepage (splash template)
  styles/
    global.css      # Design tokens + Starlight theme overrides (only global CSS file)
  assets/           # Static images (logo.png, houston.webp)
```

## Key Rules

- **No shared components directory** — no reusable `.astro` component files exist; all markup/styles/scripts are self-contained in each page
- **Custom pages** (non-doc UI) go in `src/pages/`, wrapping content with `StarlightPage` from `@astrojs/starlight/components/StarlightPage.astro`
- **Doc content** goes in `src/content/docs/docs/` — the extra `docs/` nesting is deliberate so slugs become `docs/getting-started`, `docs/features/tasks`, etc.
- `global.css` is the only global stylesheet; do not create additional global files

## Naming Conventions

- Page files: kebab-case (e.g., `download.astro`, `feedback.astro`)
- Doc files: kebab-case (e.g., `getting-started.md`, `ai-decompose.md`)
- Assets: kebab-case (e.g., `logo.png`)

## Examples

- Custom page: [`src/pages/download.astro`](../../../src/pages/download.astro)
- Custom page with form: [`src/pages/feedback.astro`](../../../src/pages/feedback.astro)
- Doc content: [`src/content/docs/docs/getting-started.md`](../../../src/content/docs/docs/getting-started.md)
