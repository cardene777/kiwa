# @kiwa-test/data

## 0.1.1

### Patch Changes

- c0f0a97: Lock in mutation testing across all 11 packages with a release-time gate. `scripts/check-mutation-gates.mjs` reads each package's `mutation-report/mutation.json` and enforces per-package MSI thresholds (90% for pure-logic — api / a11y / ui after PR 1-5; 80% for thin wrappers around third-party libs). Release workflow now runs `pnpm test:mutation` for every package and fails the publish if any package's MSI regresses below its threshold. Current snapshot: api 96.06 / a11y 93.62 / ui 91.76 / cli-test 89.69 / data 86.93 / spec 85.51 / core 85.09 / cli 84.44 / e2e 84.21 / observability 84.12 / visual 83.02 — all above thresholds. No public API change.
- Updated dependencies [c0f0a97]
  - @kiwa-test/spec@0.1.1

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
