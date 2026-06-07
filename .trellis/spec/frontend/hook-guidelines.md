# Hook Guidelines

> This project has no React hooks. It is a static Astro site with vanilla JS/TS in `<script>` blocks.

## Interactivity Pattern

All client-side interaction uses vanilla DOM in `<script>` blocks inside `.astro` files:

```astro
<script>
  document.getElementById('my-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ...
  });
</script>
```

Real example: [`src/pages/feedback.astro:46-101`](../../../src/pages/feedback.astro)

## Rules

- Use `?.` optional chaining when querying DOM elements that may not exist
- Use `as HTMLFormElement`, `as HTMLInputElement` etc. for type assertions on DOM queries
- Use `!` non-null assertion only when the element is guaranteed to exist (e.g., rendered in the same file)
- Keep scripts simple — no external state libraries, no reactive frameworks
- If logic is > ~50 lines, consider splitting into a `src/scripts/` utility file (none exist yet, but that's where they'd go)

## No Custom Hooks

There are no custom hook files in this project. Do not create `useXxx` patterns.
