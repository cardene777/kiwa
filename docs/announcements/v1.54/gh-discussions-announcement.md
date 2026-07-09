# kiwa v1.54 released — 2 軸 milestone (rules 昇格 + Mobile 深化 V、 pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設、 32 milestone snippet streak)

## Summary

kiwa v1.54 is out。 **2 軸 milestone** = rules/git-workflow.md § GitHub API rate limit 対策 rule 昇格 + Mobile v0.5 child_process.spawn stub 実装、 **縦深化 pair 第 13 の 5 段目 (Phase 5、 pair 深度 5 段拡張 1 例目 candidate) 完成**、 **kiwa milestone 史上初 depth-5 record**。

## What's new

### 軸 1 — rules 昇格

- v1.51-v1.53 の 3 milestone 実証済 REST 経路 default 化 pattern を `rules/git-workflow.md § GitHub API rate limit 対策` SSOT に正式昇格
- 7 REST 経路 example 明示 = PR create / Issue create / Label create / Issue close / PR merge / Branch delete / Comment add
- GraphQL rate limit exceeded 時、 「rate limit 回復待ち」 ではなく 「即座に REST 経路切替」 が rule 化

### 軸 2 — Mobile v0.5 child_process.spawn stub

- `@kiwa-lab/mobile` v0.4 → v0.5 minor bump、 `spawn-driver.ts` 新規
- `invokeMobileCli(inv)` = env-gate + spawn shape 契約 + fail-closed
- `cliForAxis(axis)` = 11 axis → 6 CLI mapping (CLI-backed 7 axis / non-CLI 4 axis)
- 6 CLI stub = `expo build` / `metro bundle` / `codegen run` / `react-native start` / `pod install` / `gradle build`
- backward compat 絶対維持 = v0.1 + v0.2 + v0.3 + v0.4 API 変更 0

### 5 段構造完成 (Phase 5、 pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設)

- **v1.50 (base)** = mobile v0.1 + 3 axis semantics
- **v1.51 (2 段目)** = mobile v0.2 + 4 advanced II axis + env-gate helper
- **v1.52 (3 段目)** = mobile v0.3 + 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = depth-4 4 例目)** = mobile v0.4 + adapter layer
- **v1.54 (5 段目 = depth-5 pattern 新設 1 例目 candidate)** = mobile v0.5 + spawn-driver stub

### 1 new dogfood app

- `dogfood-mobile-real-cli-app` = 6 CLI stub workflow + env-gate 3 pattern + fail-closed 検証、 10 test

### 1 new tutorial + migration + concept

- **[Tutorial 114 — Mobile spawn stub](https://cardene777.github.io/kiwa/tutorials/114-mobile-real-cli)**
- Migration v1.53 → v1.54 additive + 3 pattern SSOT + depth-5 pattern 新設 1 例目 candidate
- Concept doc `mobile-testing-real-cli.md` = spawn-driver SSOT + 6 CLI 対応表 + 11 axis mapping + depth-5 pattern 新設 SSOT + Phase 6 計画

### 32-milestone consecutive snippet validation streak

v1.23 → v1.54 = 32 milestone streak、 kiwa 史上最長記録更新継続。

### depth-5 pattern 新設 = kiwa milestone 史上初

- **v1.40 AI/LLM** (v1.12→v1.15→v1.25→v1.40) = depth-4 record 1 例目
- **v1.41 Payment** (v1.14→v1.23→v1.33→v1.41) = depth-4 record 2 例目
- **v1.42 Observability** (v1.14→v1.17→v1.35→v1.42) = depth-4 record 3 例目
- **v1.53 Mobile** (v1.50→v1.51→v1.52→v1.53) = depth-4 record 4 例目、 depth-4 pattern 4 例安定化
- **v1.54 Mobile** (v1.50→v1.51→v1.52→v1.53→v1.54) = **depth-5 record 1 例目**、 **depth-5 pattern 新設**

## Install

```bash
pnpm add -D @kiwa-lab/mobile@^0.5
```

## Migration guide

[v1.53 → v1.54](https://cardene777.github.io/kiwa/migrations/v1.53-to-v1.54)

## What's next

- v1.55 前後 = Mobile v0.6 実 child_process.spawn 実行 (stub → 実 CLI spawn 実行)
- 他 pair 5 段拡張 = v1.40 AI/LLM / v1.41 Payment / v1.42 Observability depth-4 record からの depth-5 拡張 candidate
- 他 pair 4 段化 or 横串 sweep 4 例目 or v2.0 Desktop adapter
