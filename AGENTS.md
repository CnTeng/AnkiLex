# Agent Guide

This file defines instructions for agentic coding assistants working in this
repository.

Follow these rules when generating or editing code.

## Project Overview

- Language: TypeScript
- Bundler: Vite
- Module system: ESM ("type": "module")
- Tests: Vitest (jsdom, globals)
- Formatter: Prettier
- Styling: TailwindCSS
- Alias: `@lib/*` -> `src/lib/*`

## Build and Test Commands

### Build

- `npm run build` (all platforms)
- `npm run build:chrome`
- `npm run build:firefox`
- `npm run build:zotero`

### Package

- `npm run package` (all platforms)
- `npm run package:chrome`
- `npm run package:firefox`
- `npm run package:zotero`

### Clean

- `npm run clean`

### Format

Prettier is the source of truth for formatting.
Do not manually align code.

- `npm run format`

### Typecheck

Use TypeScript compiler for type validation:

- `npx tsc --noEmit`

### Tests

Run all tests:

- `npm test`

Run single file:

- `npm test -- src/lib/dictionary/__tests__/collins.test.ts`

Run by pattern:

- `npm test -- -t "collins"`

⚠️ Do not run `npm test` unless explicitly requested.

Default test strategy:

- Do not run tests unless explicitly requested.
- If explicitly requested, prefer single-file tests first.
- If explicitly requested, prefer `-t` pattern runs while iterating.
- Run full suite only when explicitly requested.

### Validation Workflow

Use this order unless the task asks otherwise:

1. `npm run format`
2. Run `npx tsc --noEmit`.
3. Skip test execution by default (test suite is currently incomplete).
4. Run build command(s) only when packaging/build behavior is affected.

## Code Style Guidelines

### General Rules

- Keep logic in one function unless reuse is needed.
- Avoid `try`/`catch` when possible.
- Avoid using the `any` type.
- Avoid non-null assertion (`!`).
- Prefer deterministic behavior.
- Prefer type inference.
- Prefer functional array methods over loops.
- Prefer early return over else.
- Prefer const over let.
- Inline variables when used once.
- Keep changes scoped to the request; avoid drive-by refactors.
- Do not edit unrelated files unless required by the task.

```ts
// Good
const text = await fs.promises.readFile(path.join(dir, "journal.json"), "utf8");

// Bad
const journalPath = path.join(dir, "journal.json");
const text = await fs.promises.readFile(journalPath, "utf8");
```

### Naming

- Follow standard TypeScript naming conventions.
- Use `camelCase` for variables, parameters, functions, and object members.
- Use `PascalCase` for types, interfaces, classes, and enums.
- Use `UPPER_SNAKE_CASE` only for true compile-time constants.
- Short names are fine for tight local scope (`i`, `j`, `el`, `err`) when
  intent is obvious.

```ts
// Good
const selectedRange = getSelectionRange();

// Bad
const data = getSelectionRange();
```

### Imports

- Use `import type` for type-only imports.
- Prefer `@lib/*` alias for `src/lib/*` imports.
- Use relative imports for siblings.
- Remove unused imports.

### Types

- `tsconfig` is strict. Fix type errors rather than weakening types.
- Prefer inference over explicit annotations unless exporting or clarifying.
- Use `unknown` instead of `any` when the type is not known.
- Avoid type assertions; use them only when runtime checks guarantee the shape.

### Control Flow

- Prefer `const` over `let`.
- Use early returns to avoid `else`.
- Use ternaries only when they improve clarity.

```ts
// Good
function foo() {
  if (condition) return 1;
  return 2;
}

// Bad
function foo() {
  if (condition) return 1;
  else return 2;
}
```

### Error Handling

- Avoid `try`/`catch` unless needed for contextual errors or recovery.
- When catching, keep scope narrow and rethrow with a clearer message.
- Prefer `Error` with descriptive messages over silent failures.

## Testing Instructions

- Vitest is configured with `jsdom` and `globals`.
- Prefer targeted tests over broad suites when debugging.
