# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1492%) 以上の悪化が必要) |
| presence_workload (trackPresence 10 users + untrack) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2240%) 以上の悪化が必要) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +8157%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.09ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.05ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.03ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -5968 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | -9512 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 11072 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_broadcast (subscribe + 20 publish)

# Perf Report — chat_room_broadcast (subscribe + 20 publish).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +4.59% |
| p95 | 0.04ms | 0.03ms | +0.00ms | +5.01% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +2.01% |
| mean | 0.02ms | 0.02ms | -0.00ms | -0.49% |
| min | 0.01ms | 0.02ms | -0.00ms | -13.96% |
| max | 0.04ms | 0.04ms | +0.00ms | +1.37% |
| total | 0.34ms | 0.34ms | -0.00ms | -0.49% |

### presence_workload (trackPresence 10 users + untrack)

# Perf Report — presence_workload (trackPresence 10 users + untrack).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +8.61% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -34.91% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -39.62% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.25% |
| min | 0.01ms | 0.01ms | +0.00ms | +17.27% |
| max | 0.02ms | 0.03ms | -0.01ms | -40.57% |
| total | 0.18ms | 0.19ms | -0.01ms | -5.25% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.81% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.78% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.94% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.15% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.97% |
| max | 0.01ms | 0.01ms | +0.00ms | +20.75% |
| total | 0.07ms | 0.07ms | +0.00ms | +1.15% |

