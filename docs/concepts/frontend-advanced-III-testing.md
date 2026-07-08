---
title: Frontend advanced III testing — v1.49 6 axis SSOT
---

# Frontend advanced III testing — v1.49 6 axis SSOT

## What this covers

`@kiwa-test/component` v0.4 + `@kiwa-test/nextjs` v1.3 の pair minor bump による Frontend 深化 III 6 axis SSOT。 v1.34 で導入した advanced 4 axis に、 v1.49 で 4 new axis (component 側 2 + nextjs 側 2) 追加、 3 target × 6 axis = 18 row grid に拡張。

## 6 axis 一覧

### component 側 (@kiwa-test/component v0.4)

- **rsc-harness** (v1.34) — React Server Components render + suspense boundary + streaming chunk
- **streaming-ssr** (v1.34) — Streaming SSR + selective hydration + progressive hydration + error boundary
- **view-transitions** (v1.34) — View Transitions API + element / document transition + animation assert
- **form-action-advanced** (v1.34) — Form action + status pending + optimistic + progressive enhancement
- **react-19-actions** (v1.49 new) — React 19 useActionState + useOptimistic + useFormStatus 統合、 4 state (idle / transition-pending / optimistic-committed / resolved)
- **islands-architecture** (v1.49 new) — Astro / Deno Fresh / Solid Start の Islands architecture、 5 state (idle / registered / hydrating / interactive / static-verified)

### nextjs 側 (@kiwa-test/nextjs v1.3)

- **server-action-advanced** (v1.34) — Server Actions v2 + revalidatePath + revalidateTag + redirect
- **partial-prerendering** (v1.34) — PPR static shell + dynamic hole + streaming boundary
- **interception-routes** (v1.34) — Parallel + intercepting routes
- **parallel-routes-advanced** (v1.34) — Parallel routes + slot navigation + error boundary
- **turbopack-hmr** (v1.49 new) — Next.js 15 Turbopack HMR + fast refresh、 5 state (idle / updating / boundary-found / applied / refresh-completed)
- **concurrent-transitions** (v1.49 new) — React 18/19 concurrent features + interrupt-and-restart、 5 state (idle / started / pending / interrupted / committed)

## 3 target × 6 axis fidelity harness

- component target = storybook8 + playwright-ct + chromatic
- nextjs target = app-router + pages-router + edge-runtime

fidelity harness で 3 × 6 = 18 row grid を `collectFidelityCoverage()` で collect 可能。 v1.34 12 row → v1.49 18 row の縦横 SSOT 拡張。

## backward compat 絶対維持

v1.34 で導入した 4 axis (component / nextjs 各 4) の API は v1.49 で **一切変更なし**、 新 axis は additive の optional path。 既存 code は無修正で v0.3 → v0.4 (component) / v1.2 → v1.3 (nextjs) に upgrade 可能。

## 縦深化 pair 第 6 pair 3 段拡張達成

Frontend pair の 3 段構造。

- **v1.16 (base)** = component v0.1 + Storybook 8 + Playwright CT + Chromatic mock 6 base semantics
- **v1.34 (2 段目)** = component v0.3 + nextjs v1.2 advanced 8 axis
- **v1.49 (3 段目 = 3 段拡張達成)** = component v0.4 + nextjs v1.3 advanced III 6 axis grid

v1.36 Search + v1.44 Auth + v1.45 Realtime に続く **4 例目 pair 深度 3 段記録**、 3 段拡張 pattern の 4 例安定化を実証。

## Phase 4 (v1.50+) 計画

- 新 axis 追加 (React Compiler + View Transitions Level 2 + Web Components 統合)
- real driver env-gate (Playwright + Chromatic + Storybook 8 real target)
- perf-harness strict mode で axis 実行 latency baseline 化
