# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.03ms | 100ms | PASS | stable |
| presence_workload (trackPresence 10 users + untrack) | 0.02ms | 100ms | PASS | stable |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.01ms | 100ms | PASS | improved |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.08ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.05ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.01ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 208624 B | 0 B | 102400 B | PASS |
| presence_workload (trackPresence 10 users + untrack) | -6858416 B | 0 B | 102400 B | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 222296 B | 0 B | 102400 B | PASS |

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
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +9.47% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -5.38% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -5.87% |
| mean | 0.02ms | 0.02ms | +0.00ms | +3.38% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.63% |
| max | 0.03ms | 0.03ms | -0.00ms | -5.98% |
| total | 0.30ms | 0.29ms | +0.01ms | +3.38% |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +4.73% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +2.49% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -5.75% |
| mean | 0.01ms | 0.01ms | +0.00ms | +4.81% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.03ms | -0.00ms | -7.18% |
| total | 0.22ms | 0.21ms | +0.01ms | +4.81% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 515.84ms | -515.84ms | -100.00% |
| p95 | 0.01ms | 531.22ms | -531.21ms | -100.00% |
| p99 | 0.02ms | 532.23ms | -532.21ms | -100.00% |
| mean | 0.01ms | 514.09ms | -514.09ms | -100.00% |
| min | 0.00ms | 494.09ms | -494.09ms | -100.00% |
| max | 0.02ms | 532.48ms | -532.47ms | -100.00% |
| total | 0.08ms | 7711.41ms | -7711.33ms | -100.00% |

