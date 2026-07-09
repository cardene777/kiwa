# dogfood-rabbitmq-worker-app

Dogfood app 2 (v1.11-3) — order-processing worker driven by `@kiwa-lab/queue` RabbitMQ basic + advanced adapters (`KIWA_MODE=mock`) vs a live rabbitmq:3-management broker (`KIWA_MODE=real`), so behavioural fidelity can feed `@kiwa-lab/quality-metrics`.

## Modes

- `KIWA_MODE=mock` (default) — `makeMockAdapter()` wraps `setupRabbitMQAdvancedEnv` (v1.10-3 + v1.10-4)
- `KIWA_MODE=real` — `makeRealAdapter()` reads `RABBITMQ_URL` (amqp://…) + optional `RABBITMQ_MANAGEMENT_URL`; falls back to a graceful skip when env is missing

## Worker flows

- DLX pipeline — invalid orders route to `work.triage` via `dlx.work` exchange
- Delayed reminder — `x-delayed-message` exchange + deterministic `advanceClock`
- Retry policy — nack-with-requeue N times, then succeed
- Quorum queue survival — `assertQuorumHealthy({ minReplicas: 2 })` after stopping a node
- Federation ingest — upstream broker replicates onto downstream `dlx.work`
- Auto-reconnect — amqp-connection-manager style exponential backoff (100ms → 200 → 400 …)

## Emit a fidelity report

```bash
pnpm test
cat quality-report/fidelity-latest.md
```

The `quality-report/` dir is git-ignored; promote snapshots to `docs/quality-reports/` when a canonical release-gate reading is desired.

## Related

- v1.10-3 RabbitMQ basic adapter (`packages/queue/src/rabbitmq/`)
- v1.10-4 RabbitMQ advanced adapter (`packages/queue/src/rabbitmq-advanced/`)
- v1.11-1 quality-metrics harness
- v1.11-2 dogfood-supabase-saas-app (fidelity harness pattern origin)
- v1.11 milestone parent [#680](https://github.com/cardene777/kiwa/issues/680), this sub [#683](https://github.com/cardene777/kiwa/issues/683)
