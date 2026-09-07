# EE Tools — agent notes

IEC / metric electrical calculators. Formulas live in TypeScript modules, not in React.

## Add a tool in 4 steps

1. Write pure functions in `lib/calc/<name>.ts` and textbook examples in `lib/calc/<name>.test.ts`. Never put formulas in components.
2. Build the UI in `components/tools/<name>-calculator.tsx` using `NumericInput` / `ResultCard`. Show the equation on the results card. Reuse `lib/units.ts` for SI prefixes.
3. Register metadata in `config/tools.ts` (`slug`, `name`, `category`, `description`, `icon`). Home, sidebar, search, sitemap, and `/tools/[slug]` read this file.
4. Map the slug to the component in `components/tools/tool-view.tsx`.

Run `npm test` after formula changes. Do not add NEC/AWG or IEC 60364 ampacity tables unless the user asks — voltage drop is simplified resistivity + optional reactance only.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
