---
title: Mobile v0.6 実 child_process.spawn 実行 — v1.55 depth-5 pattern 実装完成 SSOT
---

# Mobile v0.6 実 child_process.spawn 実行 — v1.55 depth-5 pattern 実装完成 SSOT

## What this covers

`@kiwa-test/mobile` v0.6 の 実 child_process.spawn 実行 SSOT (env sanitize + timeout enforcement + buffer 上限 + allowlist per command + dry-run + DI 経路)、 縦深化 pair 第 13 の 6 段目 (Phase 6、 **depth-5 pattern 実装完成**、 kiwa milestone 史上初 6 段拡張)。 v1.54 stub 契約層の上に v1.55 で 実 spawn 実行を lay、 v0.5 shape 契約 preserving で backward compat 絶対維持。

## spawn-executor SSOT

### SpawnExecutorInput / SpawnExecutorResult

```ts
export interface SpawnExecutorInput {
  command: MobileCliCommand;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
  timeoutMs?: number;      // default 60_000
  maxBufferBytes?: number; // default 10 * 1024 * 1024
}

export interface SpawnExecutorResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
}
```

### 3 main function

- `executeSpawn(input, spawnFn?)` = 実 spawn 実行、 SpawnFn 注入可能
- `sanitizeEnv(command, env)` = command per-command allowlist で env sanitize
- `invokeMobileCliWith(inv, spawnFn)` = spawn-driver 経由、 shape 契約 preserving

## per-command env allowlist (COMMAND_ENV_ALLOWLIST)

| Command | allowlist |
|---|---|
| `expo build` | PATH / HOME / NODE_ENV / EXPO_TOKEN / EAS_TOKEN |
| `metro bundle` | PATH / HOME / NODE_ENV / METRO_CACHE_DIR |
| `codegen run` | PATH / HOME / NODE_ENV |
| `react-native start` | PATH / HOME / NODE_ENV / RCT_METRO_PORT |
| `pod install` | PATH / HOME / LANG / COCOAPODS_DISABLE_STATS |
| `gradle build` | PATH / HOME / JAVA_HOME / ANDROID_HOME / ANDROID_SDK_ROOT / GRADLE_USER_HOME |

**secret 漏洩防止** = allowlist 未 include の env (AWS_SECRET_ACCESS_KEY / NPM_TOKEN / OPENAI_API_KEY / STRIPE_SECRET_KEY 等) は必ず sanitize で除去、 実 spawn 時に child process 環境から完全排除。

## 3 経路 = 実 CLI 有無問わず決定的

- **Dry-run** = `KIWA_MOBILE_SPAWN=dry-run` で shape のみ、 実 spawn 未実行
- **DI** = SpawnFn を注入して決定的挙動、 CI 環境で 実 CLI 依存なし
- **実 spawn** = default 経路、 env sanitize + allowlist + timeout + buffer 上限で safe に実行

## safety guards

- **timeout enforcement** = default 60_000ms、 超過時 SIGKILL + timedOut=true
- **buffer 上限** = default 10MB、 超過時 stdout/stderr に `[buffer exceeded]` suffix + SIGKILL
- **args 上限** = 32 個、 超過で throw (shell injection surface 抑制)
- **shell 実行拒否** = spawn options で shell: false 固定、 shell metacharacter 経路遮断
- **detached 実行拒否** = spawn options で detached: false 固定、 daemon 化防止

## backward compat 絶対維持

- v0.1 (v1.50) semantics API 変更 0
- v0.2 (v1.51) env-gate helper 変更 0
- v0.3 (v1.52) New Architecture semantics 変更 0
- v0.4 (v1.53) adapter interface + factory + fidelity harness 変更 0
- v0.5 (v1.54) spawn-driver stub shape 契約 変更 0 (SpawnResult 構造 preserving)
- v0.6 実 spawn 実行は 完全 additive、 v0.1-v0.5 で書いた test は無修正で v0.6 でも継続動作 (dry-run 経路 or DI 経路 or 実 CLI install 済)

## 縦深化 pair 第 13 の 6 段目 (Phase 6、 depth-5 pattern 実装完成)

Mobile pair の 6 段構造。

- **v1.50 (base)** = 3 axis semantics
- **v1.51 (2 段目)** = 4 advanced II axis + env-gate helper
- **v1.52 (3 段目)** = 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = depth-4 4 例目)** = 22 adapter + fidelity harness
- **v1.54 (5 段目 = depth-5 pattern 新設 kiwa milestone 史上初)** = spawn stub 契約層
- **v1.55 (6 段目 = depth-5 pattern 実装完成)** = 実 child_process.spawn 実行 + env sanitize + safety guards

**Mobile pair は kiwa milestone 史上初 6 段拡張 candidate**、 depth-5 pattern の実装完成、 depth-5 3 例安定化までは v1.60-v1.70 前後で candidate (他 pair での depth-5 拡張)。

## Phase 7 (v1.56+) 計画

- **他 pair depth-5 拡張** = AI/LLM / Payment / Observability の depth-4 record からの depth-5 拡張、 depth-5 pattern 2 例目 → 3 例安定化 candidate
- **Mobile v0.7 spawn 契約強化** = SpawnStreamResult (stdout / stderr の chunk stream 経路)、 real-time output 監視
- **fidelity harness v3** = mock/real の stdout diff SLA + durationMs 差分許容範囲 SSOT
