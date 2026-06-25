---
"@kiwa-test/data": minor
---

v3 — @kiwa-test/data v0.1.0 新設: data pipeline / queue / cron / batch test adapter

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
