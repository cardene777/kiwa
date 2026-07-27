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
| chat_room_broadcast (subscribe + 20 publish) | 0.07ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.09ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -7424 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | 1688 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | -14432 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -6.26% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -7.98% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -1.11% |
| mean | 0.02ms | 0.02ms | -0.00ms | -0.86% |
| min | 0.01ms | 0.01ms | +0.00ms | +5.94% |
| max | 0.03ms | 0.03ms | +0.00ms | +0.39% |
| total | 0.28ms | 0.28ms | -0.00ms | -0.86% |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.52% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -0.55% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -2.75% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.85% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.68% |
| max | 0.02ms | 0.02ms | -0.00ms | -3.18% |
| total | 0.18ms | 0.19ms | -0.01ms | -3.85% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.06% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +4.59% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +5.26% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.72% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.17% |
| max | 0.01ms | 0.01ms | +0.00ms | +5.42% |
| total | 0.06ms | 0.07ms | -0.00ms | -1.72% |

