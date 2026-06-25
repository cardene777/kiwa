# test-spec-orders (data layer)

注文 queue processor の Layer 1 spec。
queue / cron / time-warp / idempotency / DLQ の経路を統合表現する。

- module: orders
- layer: data

## テストケース

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Topic |
|---|---|---|---|---|---|---|---|---|
| T-DATA-001 | 正常注文受付 | maxAmount=1000 | send order(1, 500) | acceptedOrders=[1] | P0 | yes | mock | orders |
| T-DATA-002 | 金額超過 | maxAmount=1000 | send order(2, 5000) | rejectedOrders=[2] | P0 | yes | mock | orders |
| T-DATA-003 | dedupKey で重複排除 | maxAmount=1000 | 同 dedupKey で 2 回 send | queue size +1 のみ | P0 | yes | mock | orders |
| T-DATA-004 | nack で再配送 | maxAmount=1000 | 1 回目 nack、 2 回目 ack | invocations >= 2 | P1 | yes | mock | orders |
| T-DATA-005 | maxReceiveCount で DLQ | maxReceiveCount=3 | 常に nack する handler | dlqSize=1 | P1 | yes | mock | orders |
| T-DATA-006 | cron schedule で定期発火 | 100ms interval | advanceMs(350) | 3 回発火 | P0 | yes | mock | cron |
| T-DATA-007 | unschedule で停止 | 50ms interval、 120ms 後 unschedule | advanceMs(500) | 発火回数 2 で停止 | P1 | yes | mock | cron |

## 自動化方針

mode = mock は in-memory queue (`setupQueueEnv({ mode: 'mock' })`) + `createFakeClock()` で deterministic に進める。
mode = live は将来 SQS / Kafka 実装で同 API を提供 (本 PoC では未使用)。
