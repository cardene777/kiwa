---
"@kiwa-test/nextjs": patch
---

🎉 Next.js React Server Components (RSC) test adapter (Issue #494) — `renderServerComponent({ component, props })` で async server component を direct await + element tree を `findAll(tree, predicate)` / `textContent(tree)` で検証する軽量 helper を追加。

## API

- `renderServerComponent<TProps>(opts): Promise<RenderServerComponentResult>` — async / sync server component を invoke して `{ tree, signal, error }` を返す。
- `findAll(tree, predicate)` — element tree を再帰的に walk して predicate を満たす element 全件返す。
- `textContent(tree)` — string / number leaf を space joined で連結 (`expect(textContent(tree)).toContain('hello')` 用)。
- `NOT_FOUND_SYMBOL` / `FORBIDDEN_SYMBOL` / `RSC_REDIRECT_SYMBOL` — component が throw する signal の brand。
- types: `RscNode` / `RscElement` / `RscSignal` / `NotFoundSignal` / `ForbiddenSignal` / `RscRedirectSignal` / `RenderServerComponentOptions` / `RenderServerComponentResult`。

## Coverage

13 unit tests (正常系 / 空 props / sync component / findAll / textContent / 3 signals / 異常系 / data-testid 検索 / fetch / string return / boolean & null children) で `lines / branches / functions / statements` 全 100%。

## Companion

- `/kiwa-nextjs` skill SKILL.md description / 3 mode (server-action + middleware + rsc) / RSC mode 9 column 拡張表 + test 生成 template を追加。
- `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `nextjs-rsc` 追加、 出力 path 表 / Glob 表に entry 追加。
- `examples/nextjs-rsc-poc/` 新規 (5 case PoC、 UserPage notFound + UserList searchParams filter)。
- README Limitations 表で RSC ❌ → ✅ production-ready (v1.0.3+) に更新。

## Scope

軽量 element-tree 検証 helper。 full RSC flight payload format、 client component (`'use client'`) 境界、 suspense streaming は対象外 (server component が return する element の shape を assertion する用途に限定)。
