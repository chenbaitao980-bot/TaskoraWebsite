# Quality Guidelines

## Build Verification

The only required quality gate is: **`npm run build` must pass with zero errors**.

- Starlight build catches broken sidebar slugs, missing content, and type errors
- Run locally before pushing: `npm run build`
- Vercel CI also runs `npm run build` on every push

## Sidebar Slug Rule (learned from a deploy failure)

Every slug referenced in `astro.config.mjs` sidebar must have a matching content file:

```
slug: 'docs/getting-started'  →  src/content/docs/docs/getting-started.md  ✅
slug: 'docs/nonexistent'      →  (no file)                                   ❌ build fails
```

When adding a sidebar entry, create the corresponding `.md` file first.

## CSS Quality

- Always include `[data-theme='dark']` overrides when hardcoding light-mode colors in `<style>` blocks
- Use Starlight CSS variables (`var(--sl-color-*)`) instead of hardcoded hex where possible
- Test visual output at both light and dark themes

## Content Quality

- All doc pages must have `title` and `description` in frontmatter
- Chinese copy — maintain consistent tone (friendly, direct, no formal 您)

## No Testing Requirements

This is a static marketing/docs site. There are no unit or integration tests. `npm run build` is the test.

## Linting

No ESLint config is present. Astro's TypeScript checker (via `astro check` or build) is the linter.
