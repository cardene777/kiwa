# @kiwa-lab/core reference

[日本語](/libraries/foundation/core/reference)

## `parseSpec(markdown, options?)`

Parses Markdown metadata and its first table into a `SpecDoc`.

```ts
import { parseSpec } from "@kiwa-lab/core";

const doc = parseSpec(markdown, {
  module: "wallet-connect",
  defaultLayer: "e2e",
});
```

`ParseOptions` has `module?: string` and `defaultLayer?: TestLayer`. When you specify `module`, it takes precedence over the Markdown `module` metadata. The default `defaultLayer` is `unit`.

The returned `SpecDoc` has this shape.

| Field | Description |
| --- | --- |
| `module` | Module name from metadata or options |
| `layer` | `contract` / `unit` / `integration` / `e2e` / `api` / `ui` / `data` / `cli` |
| `cases` | Parsed `SpecCase[]` |
| `raw` | Input Markdown |
| `warnings` | Warnings collected while parsing |

`SpecCase` has required `id`, `observation`, `given`, `when`, `then`, `priority`, and `automation` fields, plus optional `mode`, `route`, and `notes`. `mode` is `mock` / `live` / `hybrid`.

Implementation: [`parser.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/parser.ts); types: [`types.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts).

## `createPool(options)`

Creates resources asynchronously and returns a `Pool<T>`.

```ts
import { createPool } from "@kiwa-lab/core";

const pool = await createPool({
  size: 1,
  acquire: async () => ({ reset: async () => undefined }),
  reset: async (value) => value.reset(),
});
```

`PoolFactoryOptions<T>` accepts the following options.

| Option | Required | Description |
| --- | --- | --- |
| `size` | Yes | Number of resources to acquire in advance. A positive integer. |
| `acquire` | Yes | Function that creates a resource asynchronously. |
| `reset` | No | Reset function called by `Lease.release()`. |
| `release` | No | Shutdown function called for each resource by `Pool.stopAll()`. |

`Pool<T>` has `size`, `borrow()`, and `stopAll()`. The `Lease<T>` returned by `borrow()` has `value` and `release()`.

Implementation: [`pool.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/pool.ts).

## Shared types

`TestEnvBase<TMode>` is the structural type of a test environment with `{ mode, stop }`. `TestLayer`, `TestMode`, `TestEnvBase`, `SpecCase`, `SpecDoc`, `Lease`, and `Pool` are exported as types from the package root.

For all public exports, see [`packages/core/src/index.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/index.ts).
