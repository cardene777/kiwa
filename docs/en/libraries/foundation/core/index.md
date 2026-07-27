# @kiwa-lab/core

[日本語](/libraries/foundation/core/)

`@kiwa-lab/core` provides the shared "types for reading specifications" and a pool for reusable test resources used by kiwa adapters. It is a small foundation package that aligns specifications, test environments, and leases across dApp, API, UI, data, and CLI tests.

```bash
pnpm add -D @kiwa-lab/core
```

## What it solves

This package provides two independent capabilities.

| Capability | When to use it | Primary API |
| --- | --- | --- |
| Parse Markdown specifications | Extract test cases from a specification table | `parseSpec()` |
| Reuse expensive resources | Share servers, browsers, workers, and similar resources across parallel tests | `createPool()` |

`TestLayer`, `TestMode`, `TestEnvBase`, `SpecDoc`, `Lease`, and `Pool` are shared types used by these capabilities and by adapters.

## When to use it—and when not to

Use this package when you want to read kiwa-design Markdown specifications programmatically, or when you need to reuse resources that are expensive to start safely across tests. `createAnvilPool()` in `@kiwa-lab/dapp` follows the same borrow-and-release model for the latter case.

This package is not a test runner. It does not automatically start HTTP servers, browsers, or Anvil. Choose an adapter for the target you are testing, and use `core` directly only when you need specification parsing, shared types, or the general-purpose pool.

## How it works

`parseSpec()` reads the `module` and `layer` metadata and the first Markdown table it finds. Invalid input, such as missing required columns or an unknown `mode`, is generally recorded in `warnings` rather than thrown as an exception.

`createPool()` first calls `acquire()` for `size` resources. If none are available, `borrow()` waits. When a lease is returned, the pool completes `reset()`, if specified, before handing that resource to the next consumer.

## Continue reading

- [Parse a specification](./quickstart)
- [Reuse test resources](./guides/reuse-expensive-resources)
- [API reference](./reference)

## Implementation basis

This page is based on [`packages/core/src/index.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/index.ts), [`parser.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/parser.ts), and [`pool.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/pool.ts).
