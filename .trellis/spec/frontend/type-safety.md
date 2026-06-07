# Type Safety

## TypeScript Usage

TypeScript is used inside `<script>` blocks in `.astro` files. There are no separate `.ts` type files.

### DOM type assertions (real patterns from the codebase)

```ts
const form = e.target as HTMLFormElement;
const btn = document.getElementById('submit-btn') as HTMLButtonElement;
const result = document.getElementById('feedback-result')!;
const input = form.elements.namedItem('nickname') as HTMLInputElement;
```

Pattern: use `as HTMLXxxElement` for typed DOM access; use `!` only when the element is guaranteed present (rendered in the same `.astro` file).

## Content Collection Types

Astro content collections use `docsSchema()` from `@astrojs/starlight/schema` — no custom schema definitions needed for standard doc pages.

See: [`src/content.config.ts`](../../../src/content.config.ts)

## Rules

- Prefer explicit type assertions over `any`
- Do not use `any` unless there is no alternative
- Do not create a dedicated `types/` directory unless there are 3+ shared type definitions
- Astro frontmatter types are inferred — no manual typing needed for `.md`/`.mdx` frontmatter

## tsconfig

Standard Astro tsconfig (strict mode). See [`tsconfig.json`](../../../tsconfig.json).
