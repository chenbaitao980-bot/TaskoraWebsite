# Component Guidelines

> This is a Starlight static site. "Components" are Astro pages, not React components.

## Page Structure

Every custom page (non-doc) follows this pattern:

```astro
---
import StarlightPage from '@astrojs/starlight/components/StarlightPage.astro';
---

<StarlightPage
  frontmatter={{
    title: '页面标题',
    description: '页面描述',
    // optional: template: 'splash', hero: { ... }
  }}
>
  <!-- page content -->

  <script>
    // TypeScript for interactivity (if needed)
  </script>

  <style>
    /* Scoped CSS (if needed) */
  </style>
</StarlightPage>
```

Real example: [`src/pages/feedback.astro`](../../../src/pages/feedback.astro)

## Styling Patterns

- **Scoped `<style>` blocks** inside each `.astro` file — no external CSS files per page
- Use **Starlight CSS variables** for colors/theming: `var(--sl-color-accent)`, `var(--sl-color-gray-2)`, `var(--sl-color-bg-nav)`, `var(--sl-color-text)`
- Border radius convention: `8px` for inputs/buttons, `16px` for cards
- Include `[data-theme='dark']` overrides for dark mode where colors are hardcoded
- Tailwind utility classes may be used for layout; design tokens are in `global.css` via `@theme {}`

## Markdown Doc Pages

Doc content (`.md` / `.mdx`) uses Starlight frontmatter:

```md
---
title: 页面标题
description: 一句话描述
---
```

For the homepage (`index.mdx`), use the `splash` template with `hero` config.

## Anti-Patterns

- Do NOT create a separate `.astro` component file unless a UI element is reused across 3+ pages
- Do NOT import external UI component libraries (no shadcn, no Radix, etc.)
- Do NOT use inline `style=""` attributes — use the `<style>` block
