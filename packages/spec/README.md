# @kiwa-test/spec

Common spec language + test environment abstractions for kiwa adapters (core / api / ui / data / cli).

## Overview

`@kiwa-test/spec` provides the foundational primitives that every kiwa adapter shares:

- `parseSpec(markdown)` — turn a kiwa-design 9-column markdown spec into a typed `SpecDoc` (cases, layer, mode, route, etc.)
- `createPool({ size, acquire, reset, release })` — a generic borrow/release pool with `anvil_reset`-style reuse semantics
- `TestEnvBase<TMode>` — the structural type every `setupTestEnv`-style helper returns (`mode`, `stop()`, plus adapter-specific extensions)
- `TestLayer` / `TestMode` / `Lease` / `Pool` — shared type vocabulary

Adapters (`@kiwa-test/core` for dApp E2E, `@kiwa-test/api` for HTTP) depend on this package so that specs, environments, and pools share the same shape regardless of which adapter is running them.

## Install

```bash
pnpm add -D @kiwa-test/spec
```

## Parse a kiwa-design spec

```ts
import { parseSpec } from "@kiwa-test/spec";
import { readFileSync } from "node:fs";

const doc = parseSpec(readFileSync("tests/spec/integration/test-spec-items.api.md", "utf8"));
doc.cases.forEach((c) => {
  console.log(c.id, c.observation, c.mode, c.route);
});
```

The parser reads the meta block (`- module:` / `- layer:`) and the first 9-column markdown table it finds. Unknown columns are ignored; unknown `mode` / missing required columns become `doc.warnings` instead of throwing.

## Build a borrow/release pool

```ts
import { createPool } from "@kiwa-test/spec";

const pool = await createPool({
  size: 4,
  acquire: async () => spawnExpensiveThing(),
  reset: async (thing) => thing.reset(),
});

const lease = await pool.borrow();
try {
  await use(lease.value);
} finally {
  await lease.release(); // pool calls `reset` before handing the slot to the next borrower
}

await pool.stopAll();
```

`@kiwa-test/core`'s `createAnvilPool` is built on top of this primitive so the same lifecycle pattern works for anvil instances, HTTP servers, headless browsers, queue workers, or anything else.

## License

MIT
