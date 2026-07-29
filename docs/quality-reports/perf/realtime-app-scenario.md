# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.13ms | 100ms | PASS | stable (差 0.10ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2240%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +8157%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.56ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.06ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.03ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -23832 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | -157696 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 1368 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_broadcast (subscribe + 20 publish)

# Perf Report — chat_room_broadcast (subscribe + 20 publish).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.13ms |
| p99 | 0.24ms |
| mean | 0.06ms |
| stdev | 0.06ms |
| min | 0.02ms |
| max | 0.26ms |
| total | 0.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.02ms | +0.02ms | +96.87% |
| p95 | 0.13ms | 0.03ms | +0.10ms | +300.19% |
| p99 | 0.24ms | 0.04ms | +0.20ms | +521.20% |
| mean | 0.06ms | 0.02ms | +0.04ms | +158.56% |
| min | 0.02ms | 0.02ms | +0.00ms | +11.93% |
| max | 0.26ms | 0.04ms | +0.22ms | +568.12% |
| total | 0.88ms | 0.34ms | +0.54ms | +158.56% |

### presence_workload (trackPresence 10 users + untrack)

# Perf Report — presence_workload (trackPresence 10 users + untrack).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +32.78% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -8.34% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -2.51% |
| mean | 0.01ms | 0.01ms | +0.00ms | +19.36% |
| min | 0.01ms | 0.01ms | +0.00ms | +24.53% |
| max | 0.03ms | 0.03ms | -0.00ms | -1.34% |
| total | 0.22ms | 0.19ms | +0.04ms | +19.36% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.83% |
| p95 | 0.01ms | 0.01ms | +0.01ms | +103.18% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +192.04% |
| mean | 0.01ms | 0.00ms | +0.00ms | +30.31% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +212.59% |
| total | 0.09ms | 0.07ms | +0.02ms | +30.31% |

