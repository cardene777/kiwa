---
title: Mobile v0.5 child_process.spawn stub 契約層 — v1.54 depth-5 pattern 新設 1 例目 candidate SSOT
---

# Mobile v0.5 child_process.spawn stub 契約層 — v1.54 depth-5 pattern 新設 1 例目 candidate SSOT

## What this covers

`@kiwa-test/mobile` v0.5 の spawn-driver stub 契約層 SSOT (env-gate + spawn shape 契約 + fail-closed + 6 CLI stub 呼出)、 縦深化 pair 第 13 の 5 段目 (Phase 5、 **pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設**)。 v1.53 adapter layer の上に v1.54 で spawn-driver を lay、 real CLI 呼出経路の契約層完成。

## spawn-driver interface SSOT

### SpawnInvocation

```ts
export type MobileCliCommand =
  | 'expo build'
  | 'metro bundle'
  | 'codegen run'
  | 'react-native start'
  | 'pod install'
  | 'gradle build';

export interface SpawnInvocation {
  command: MobileCliCommand;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
}
```

### SpawnResult

```ts
export interface SpawnResult {
  command: MobileCliCommand;
  args: string[];
  invoked: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}
```

### 3 main function

- `invokeMobileCli(inv: SpawnInvocation): Promise<SpawnResult>` = メイン contract、 env-gate 通過確認 + spawn shape 返却
- `cliForAxis(axis: MobileAxis): MobileCliCommand | null` = axis → CLI mapping
- `buildSpawnInvocation(input): SpawnInvocation` = spawn invocation factory

## 6 CLI stub 対応表

| CLI command | 対応 axis | v1.55+ 実 spawn 実行時 |
|---|---|---|
| `expo build` | expo | `expo build --platform ios/android/web` |
| `metro bundle` | metro | `metro bundle --entry-file index.js` |
| `codegen run` | turbo-modules, codegen | `react-native codegen --outputPath ./gen` |
| `react-native start` | react-native, fabric | `react-native start --reset-cache` |
| `pod install` | (iOS build 段階) | `cd ios && pod install` |
| `gradle build` | new-architecture | `cd android && ./gradlew build` |

## 11 axis 対応 (CLI-backed 7 + non-CLI 4)

**CLI-backed axes (7)** = 実 CLI 呼出契約対応、 `cliForAxis` が command を返す。

- react-native → `react-native start`
- expo → `expo build`
- metro → `metro bundle`
- fabric → `react-native start`
- turbo-modules → `codegen run`
- codegen → `codegen run`
- new-architecture → `gradle build`

**non-CLI axes (4)** = pure state machine 領域、 `cliForAxis` が `null` を返す。

- navigation, reanimated, async-storage, secure-storage

## env-gate + fail-closed 契約

- `env.KIWA_MOBILE_MODE !== 'real'` → immediate throw で fail-closed (「production で mock 実行」 事故防止)
- `args.length > 32` → throw で shell injection surface 抑制
- v0.5 stub 経路 = 実 spawn 実行なし、 shape 契約 + stdout に `[v0.5 spawn stub]` prefix
- v1.55+ で `child_process.spawn(cmd, args, { env, cwd })` 実行に置換、 stdout/stderr は実出力

## backward compat 絶対維持

- v0.1 (v1.50) semantics API 変更 0
- v0.2 (v1.51) env-gate helper 変更 0
- v0.3 (v1.52) New Architecture semantics 変更 0
- v0.4 (v1.53) adapter interface + factory + fidelity harness 変更 0
- v0.5 spawn-driver は完全 additive、 v0.1-v0.4 で書いた test は無修正で v0.5 でも継続動作

## 縦深化 pair 第 13 の 5 段目 (Phase 5、 pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設)

Mobile pair の 5 段構造完成 (**kiwa milestone 史上初の depth-5 record**)。

- **v1.50 (base)** = 3 axis semantics
- **v1.51 (2 段目)** = 4 advanced II axis + env-gate helper
- **v1.52 (3 段目)** = 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = depth-4 4 例目)** = 22 adapter + fidelity harness
- **v1.54 (5 段目 = depth-5 pattern 新設 1 例目)** = spawn-driver stub (6 CLI + env-gate + fail-closed)

**kiwa milestone 史上初 depth-5 record**、 depth-4 4 例安定化 (v1.40 AI/LLM + v1.41 Payment + v1.42 Observability + v1.53 Mobile) からの depth-5 は Mobile v1.54 が第 1 例、 3 例安定化まで v1.60-v1.70 前後で candidate。

## Phase 6 (v1.55+) 計画

- **Mobile v0.6 実 child_process.spawn 実行** = stub → 実 CLI spawn 実行、 実 Expo EAS + Metro + Fabric build 呼出
- **fidelity 契約強化 v2** = mock/real の stdout diff 計測 + neutral event 一致 SLA
- **他 pair 5 段拡張 candidate** = v1.40 AI/LLM / v1.41 Payment / v1.42 Observability の depth-4 から depth-5 拡張、 depth-5 pattern 3 例安定化 candidate
