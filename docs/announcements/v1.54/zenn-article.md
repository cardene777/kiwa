# kiwa v1.54 リリース — 2 軸 milestone (rules 昇格 + Mobile 深化 V、 pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設 kiwa milestone 史上初、 32 milestone snippet streak)

## 概要

kiwa v1.54 をリリースしました。 **2 軸 milestone** = rules/git-workflow.md § GitHub API rate limit 対策 rule 昇格 + Mobile v0.5 child_process.spawn stub 実装、 **縦深化 pair 第 13 の 5 段目 (Phase 5) 完成、 pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設** (kiwa milestone 史上初 depth-5 record)、 32 milestone snippet streak 継続。

## 何が変わったか

### 軸 1 — rules 昇格 (v1.51-v1.53 3 milestone 実証済 REST 経路 pattern)

`rules/git-workflow.md § GitHub API rate limit 対策` 節を新規追加、 v1.51-v1.53 の 3 milestone で 100% 回避成功した REST 経路 default 化 pattern を SSOT に正式昇格。

- 発火 trigger = `GraphQL: API rate limit already exceeded for user ID {N}` エラー検知時、 即座に REST 経路切替 (「rate limit 回復待ち」 は禁止)
- 7 REST 経路 example = PR create / Issue create / Label create / Issue close / PR merge / Branch delete / Comment add 全て `gh api -X POST/PATCH/PUT/DELETE repos/{owner}/{repo}/...` で 100% 回避可能
- core rate limit (5000/hr、 REST) は GraphQL 5000/hr と independent counter、 milestone 進行を止めない

### 軸 2 — Mobile v0.5 child_process.spawn stub (Phase 5、 depth-5 pattern 新設)

`@kiwa/mobile` v0.4 → v0.5 minor bump、 spawn-driver stub 契約層追加。

- `invokeMobileCli(inv)` = env-gate + spawn shape 契約 + fail-closed
- `cliForAxis(axis)` = 11 axis → 6 CLI mapping (CLI-backed 7 axis / non-CLI 4 axis)
- `buildSpawnInvocation(input)` = spawn invocation factory
- 6 CLI stub = `expo build` / `metro bundle` / `codegen run` / `react-native start` / `pod install` / `gradle build`
- backward compat 絶対維持 = v0.1 + v0.2 + v0.3 + v0.4 API 変更 0

### 5 段構造完成 = kiwa milestone 史上初 depth-5 record

Mobile pair の 5 段構造。

- **v1.50 (base)** = mobile v0.1 + 3 axis base
- **v1.51 (2 段目)** = mobile v0.2 + 4 advanced II axis + env-gate helper
- **v1.52 (3 段目)** = mobile v0.3 + 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = depth-4 4 例目)** = mobile v0.4 + adapter layer
- **v1.54 (5 段目 = depth-5 pattern 新設 1 例目 candidate)** = mobile v0.5 + spawn-driver stub

**v1.40 AI/LLM + v1.41 Payment + v1.42 Observability + v1.53 Mobile の depth-4 4 例安定化に続く depth-5 は Mobile v1.54 が kiwa milestone 史上初 depth-5 record**、 depth-5 pattern 3 例安定化まで v1.60-v1.70 前後で candidate。

### 1 new dogfood app + 1 tutorial + migration + concept

- **dogfood-mobile-real-cli-app** = 6 CLI stub workflow + env-gate 3 pattern + fail-closed 検証、 10 test
- **[Tutorial 114 — Mobile spawn stub](https://cardene777.github.io/kiwa/tutorials/114-mobile-real-cli)**
- Migration guide v1.53 → v1.54 additive + 3 pattern SSOT + depth-5 pattern 新設
- Concept doc `mobile-testing-real-cli.md` = spawn-driver SSOT + 6 CLI 対応表 + 11 axis mapping + depth-5 pattern 新設 SSOT + Phase 6 計画

## 32 milestone 連続 snippet validation streak 達成

v1.23 → v1.54 = 32 milestone 連続、 kiwa 史上最長記録更新継続。 累積 32 週相当の documentation investment、 compound effect が引き続き機能。

## インストール

```bash
pnpm add -D @kiwa/mobile@^0.5
```

## Migration guide

[v1.53 → v1.54](https://cardene777.github.io/kiwa/migrations/v1.53-to-v1.54)

## 次に何が来るか

v1.55 前後 = 4 候補。

- **Mobile v0.6 実 child_process.spawn 実行** = stub → 実 CLI spawn 実行、 実 Expo EAS + Metro + Fabric build 呼出
- **他 pair 5 段拡張** = v1.40 AI/LLM / v1.41 Payment / v1.42 Observability の depth-4 record から depth-5 拡張、 depth-5 pattern 3 例安定化 candidate
- **他 pair 4 段化** = Search / Auth / Realtime / Frontend の 3 段記録から 4 段拡張、 depth-4 pattern 5 例目 candidate
- **v2.0 milestone Desktop adapter** (Electron + Tauri) = base pair 第 14、 平面拡大
