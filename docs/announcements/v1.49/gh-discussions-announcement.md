# kiwa v1.49 released — Frontend 深化 III (縦深化 pair 3 段拡張 4 例目 + 27 milestone snippet streak)

## Summary

kiwa v1.49 is out. **Frontend 深化 III** (component v0.4 + nextjs v1.3 pair minor bump)、 縦深化 pair 第 6 pair **3 段拡張達成 (4 例目 pair 深度 3 段記録、 3 段拡張 pattern 4 例安定化)** milestone。 v1.16 (base) → v1.34 (advanced) → v1.49 (advanced III) の 3 段構造完成。

## What's new

### `@kiwa/component` v0.3 → v0.4

- **react-19-actions axis 新規** = React 19 useActionState + useOptimistic + useFormStatus 統合、 4 state
- **islands-architecture axis 新規** = Astro / Deno Fresh / Solid Start の Islands architecture、 5 state
- 既存 4 axis (rsc-harness + streaming-ssr + view-transitions + form-action-advanced) API 変更 0
- fidelity 3 target × 6 axis = 18 row (v1.34 12 row から拡張)

### `@kiwa/nextjs` v1.2 → v1.3

- **turbopack-hmr axis 新規** = Next.js 15 Turbopack HMR + fast refresh、 5 state
- **concurrent-transitions axis 新規** = React 18/19 concurrent + interrupt-and-restart、 5 state
- 既存 4 axis (server-action-advanced + partial-prerendering + interception-routes + parallel-routes-advanced) API 変更 0
- fidelity 3 target × 6 axis = 18 row

### 3 new dogfood app

- `dogfood-frontend-rsc-advanced-app` = RSC + React 19 Actions + Server Actions v2、 8 test
- `dogfood-frontend-view-transitions-app` = View Transitions + Concurrent + PPR、 6 test
- `dogfood-frontend-islands-turbopack-app` = Islands + Turbopack HMR + PE、 6 test

### 3 new tutorials + migration + concept

- **[Tutorial 107 — RSC + Server Actions v2](https://cardene777.github.io/kiwa/tutorials/107-rsc-server-actions-v2)**
- **[Tutorial 108 — View Transitions + Concurrent React](https://cardene777.github.io/kiwa/tutorials/108-view-transitions-concurrent)**
- **[Tutorial 109 — Islands + Turbopack HMR + PE](https://cardene777.github.io/kiwa/tutorials/109-islands-turbopack-hmr)**
- Migration v1.48 → v1.49 additive-only + 4 pattern SSOT
- Concept doc `frontend-advanced-III-testing.md` = 6 axis SSOT + 18 row fidelity grid + Phase 4 計画

### 27-milestone consecutive snippet validation streak

v1.23 → v1.49 = 27 milestone、 kiwa 史上最長記録更新継続。

## Install

```bash
pnpm add -D @kiwa/component@^0.4
pnpm add -D @kiwa/nextjs@^1.3
```

## Migration guide

[v1.48 → v1.49](https://cardene777.github.io/kiwa/migrations/v1.48-to-v1.49)

## What's next

- v1.50 前後 = new-base pair 第 13 導入 (5-milestone new-base cadence) or 他 pair 2 3 段化 or 横串 sweep 4 例目
