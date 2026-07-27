# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.03ms | 100ms | PASS | stable |
| presence_workload (trackPresence 10 users + untrack) | 0.02ms | 100ms | PASS | stable |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.24ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.05ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.03ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -21392 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | 1688 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | -3960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_broadcast (subscribe + 20 publish)

# Perf Report — chat_room_broadcast (subscribe + 20 publish).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +4.54% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +10.76% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +6.53% |
| mean | 0.02ms | 0.02ms | +0.00ms | +14.05% |
| min | 0.02ms | 0.01ms | +0.00ms | +23.10% |
| max | 0.03ms | 0.03ms | +0.00ms | +5.60% |
| total | 0.32ms | 0.28ms | +0.04ms | +14.05% |

### presence_workload (trackPresence 10 users + untrack)

# Perf Report — presence_workload (trackPresence 10 users + untrack).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.54% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +12.72% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +6.15% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.19% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.77% |
| max | 0.02ms | 0.02ms | +0.00ms | +4.86% |
| total | 0.20ms | 0.19ms | +0.01ms | +7.19% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.09% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.01% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +10.23% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.99% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.10% |
| max | 0.01ms | 0.01ms | +0.00ms | +11.50% |
| total | 0.06ms | 0.07ms | -0.00ms | -1.99% |

