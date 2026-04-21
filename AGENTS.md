# Agent instructions

## Tickets and requirements

Implement work so that **every acceptance criterion and requirement from the provided tickets is satisfied**. Trace each ticket to the code or UI it implies; do not ship partial solutions or implied scope that contradicts the tickets.

## TypeScript

- Use TypeScript **accurately and intentionally**: narrow types with guards and discriminated unions instead of assertions.
- **Do not use unsafe type casts** (e.g. `as SomeType` to silence the checker, double assertions, widening to `any`). Prefer guards and correct typings instead of `@ts-ignore` / `@ts-expect-error` unless a ticket documents a necessary upstream exception.
- For **finite sets of named values** (statuses, kinds, modes, UI variants), use a TypeScript **`enum`** (often a **string enum** when values are persisted or sent over the wire) instead of **`as const`** objects or const-asserted literal maps as the main way to model that set.
- Prefer **functional style**: pure functions where practical, immutable updates, explicit data flow, and small composable units over large stateful classes.

## Readability and control flow

- **Prioritize readability** over clever or minimal code: favor clear names, straightforward structure, and obvious data flow even if that means a few more lines.
- Use **early returns** and guard clauses so the happy path stays shallow and nested `if` / `else` ladders stay rare.
- Prefer **receive an object, return an object**: use a single options/params object instead of long positional parameter lists, and return a small named object (or typed result shape) when multiple values leave a function—this keeps call sites and signatures easier to read and extend.

## Styling (Tailwind CSS)

- Use Tailwind **correctly**: semantic layout and tokens, responsive and state variants only when needed, no duplicate utility chains for the same visual result.
- **Avoid redundant styles**: extract repeated patterns once (shared classes or shared rules), and reuse instead of copy-pasting long `className` strings.
- **Keep styles in CSS files** (e.g. global layers, dedicated component or feature stylesheets) so intent stays **clear**: name or group rules by purpose; prefer `@apply` / composition in CSS for repeated Tailwind bundles rather than scattering the same utilities across many components.

## Next.js note

This project may use Next.js APIs newer than generic training data. When unsure, read the in-repo guide under `node_modules/next/dist/docs/` and follow current deprecations.
