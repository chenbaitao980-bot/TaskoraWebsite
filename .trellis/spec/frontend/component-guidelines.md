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
- Do NOT use emoji as section icons — use inline SVG with class `section-icon` (Lucide/Heroicons style)

## Icon Convention

### Section Title Icons

All admin pages use inline SVG icons in `.section-title` blocks:

```astro
<div class="section-title">
  <svg class="section-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- icon paths -->
  </svg>
  标题文字
</div>
```

### SVG Icon Rules

- **No emoji** — replace all emoji with inline SVG
- **`viewBox="0 0 24 24"`** — standard 24×24 grid
- **`fill="none" stroke="currentColor" stroke-width="2"`** — consistent stroke weight
- **`stroke-linecap="round" stroke-linejoin="round"`** — rounded stroke ends
- **Icons should be semantically meaningful** (Wrench for settings/features, Gift for bonuses, etc.)
- **Reuse** the same icon for the same semantic concept across all pages

### Global Icon Styles

Defined in `layout.astro` `<style>`:

```css
.section-icon { color: var(--sl-color-accent); opacity: 0.85; flex-shrink: 0; }
```

This ensures consistent color (accent) and spacing across all admin pages.
