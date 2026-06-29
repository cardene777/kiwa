---
'@kiwa-test/nextjs': patch
---

Next.js App Router Parallel Routes + Intercepting Routes test helper を追加 (Issue #523、 v1.2)。

## What's added

- `invokeParallelRoutes(opts)` — `layout({ children, @modal, @sidebar })` 形式の parallel-route layout を isolated に render し、 全 slot を `Promise.all` で並列 await (slow slot が fast slot を block しない)、 per-slot error を `slotResults[]` に capture (broken slot が layout 全体を倒さない)。
- Intercepting Routes 対応 — `intercepting: { variant: 'intercepted' | 'default', url, distance }` で soft-vs-hard navigation 切替を表現、 `variant: 'default'` 時は `defaultFallback` を強制 render (Intercepting Route の hard-nav 経路を test 内で再現)。
- `PARALLEL_INTERCEPTION_SYMBOL` — `Symbol.for(...)` registered symbol で cross-realm 一致。
- 9 type を export — `InvokeParallelRoutesOptions` / `InvokeParallelRoutesResult` / `ParallelLayoutFunction` / `ParallelLayoutChildren` / `SlotComponent` / `SlotInput` / `SlotRenderResult` / `DefaultFallbackComponent` / `InterceptionMatch`。

## Coverage

- `tests/invoke-parallel-routes.test.ts` で 13 test (T-PR-001 .. T-PR-013) all pass、 parallel slot await + per-slot error isolation + default fallback + intercepting/default variant + zero slots edge case + custom childrenProps/slotProps 全部 cover。

## Companion

- skill description 更新 (`/kiwa-nextjs --layer nextjs-parallel-route` mode 追加)
- `kiwa-design` / `kiwa-review` の `--layer` enum に `nextjs-parallel-route` 追加
- stryker `mutate` + coverage `--coverage.include` に `invoke-parallel-routes.js` 追加
- release-smoke `import-surface.test.ts` に新 export 検証 block 追加
- root README Limitations 表に Next.js Parallel Routes ✅ 行追加

## Out of scope (separate Issues)

- 実 React renderer / flight payload serialization → `renderServerComponent` (leaf-level) との併用推奨
- matcher / `loading.tsx` / `error.tsx` evaluation → 別 Issue
- `'use client'` boundary → `@kiwa-test/ui` React mode
