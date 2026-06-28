# @kiwa-test/data

## 1.0.1

### Patch Changes

- 32a6c10: 📦 11 packages initial v1.0.x npm publish (改名後初回)。

  PR #476 で `@kiwa-test/core` ↔ `@kiwa-test/spec` swap rename + dApp 改名 + v1.0 major bump を local で実施したが、 npm への publish が未実行のため npm 上では旧 0.x 系のまま停滞していた。

  本 changeset で全 11 packages を v1.0.1 へ patch bump して publish を発火させ、 改名後の v1.0 系を npm に反映する。

  ## 影響範囲

  - 旧 `@kiwa-test/core` (0.3.1) は dApp E2E fixture の名残、 v1.0.1 では新 spec として publish
  - 旧 `@kiwa-test/spec` は廃止 (`@kiwa-test/core` に統合)
  - 新 `@kiwa-test/dapp` (404 → v1.0.1 として初公開)
  - 既存 9 adapter (api / ui / data / e2e / a11y / cli-test / observability / visual / cli) は v1.0.1 patch bump で公開
  - v1.0.0 → v1.0.1 patch bump (PR #476 の v1.0.0 内部 bump を上書きせず継続)

  ## 確認方法

  ```bash
  npm view @kiwa-test/core version    # → 1.0.1
  npm view @kiwa-test/dapp version    # → 1.0.1 (新規公開)
  npm view @kiwa-test/e2e version     # → 1.0.1
  npm view @kiwa-test/a11y version    # → 1.0.1
  npm view @kiwa-test/visual version  # → 1.0.1
  ```

- Updated dependencies [32a6c10]
  - @kiwa-test/core@1.0.1

## 0.1.1

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
- Updated dependencies [c0f0a97]
  - @kiwa-test/core@0.1.1

## 0.1.0

### Minor Changes

- 5ede7a1: v3 — @kiwa-test/data v0.1.0 新設: data pipeline / queue / cron / batch test adapter

  ## 新規 API

  - `setupQueueEnv({ mode })` ... in-memory queue (FIFO) + dedupKey 重複排除 + nack/ack/DLQ semantics
  - `createFakeClock({ startMs })` ... 時刻固定 + `schedule(intervalMs, fn)` + `advanceMs(ms)` + `unschedule(id)` で deterministic に進める
  - `expectIdempotent` / `expectAtLeastOnce` ... 配送セマンティクス assertion helper
  - `QueueClient` / `QueueMessage` / `QueueAckHandle` / `FakeClock` / `CronEntry` を型として export

  ## PoC

  - `examples/queue-poc/` ... orders processor + cron schedule の Layer 1 spec (7 case) + vitest test 7 件 全 PASS

  ## skill SSOT

  - `.claude/skills/kiwa-design/SKILL.md` ... `--layer data` 出力 path + data 専用 9 column 表 (Mode / Topic 追加) を SSOT 化
  - `.claude/skills/kiwa-data/SKILL.md` ... 新設、 9 column → setupQueueEnv / createFakeClock 機械変換 + 実装例
