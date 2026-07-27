# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.03ms | 100ms | PASS | stable |
| presence_workload (trackPresence 10 users + untrack) | 0.02ms | 100ms | PASS | stable |
| reconnect_resilience (5x connect/disconnect/reconnect) | 523.45ms | 100ms | FAIL | stable |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.08ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.04ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 516.75ms | 200ms | FAIL |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 402024 B | 0 B | 102400 B | PASS |
| presence_workload (trackPresence 10 users + untrack) | 542912 B | 0 B | 102400 B | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 315104 B | 0 B | 102400 B | PASS |

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -4.19% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +6.04% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +2.11% |
| mean | 0.02ms | 0.02ms | -0.00ms | -1.68% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.07% |
| max | 0.03ms | 0.03ms | +0.00ms | +1.24% |
| total | 0.29ms | 0.29ms | -0.00ms | -1.68% |

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.69% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -20.34% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -40.06% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.76% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.03ms | -0.01ms | -43.50% |
| total | 0.19ms | 0.21ms | -0.01ms | -5.76% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p50 | 505.11ms |
| p95 | 523.45ms |
| p99 | 530.15ms |
| mean | 504.93ms |
| stdev | 11.85ms |
| min | 477.66ms |
| max | 531.83ms |
| total | 7573.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 505.11ms | 515.84ms | -10.73ms | -2.08% |
| p95 | 523.45ms | 531.22ms | -7.77ms | -1.46% |
| p99 | 530.15ms | 532.23ms | -2.08ms | -0.39% |
| mean | 504.93ms | 514.09ms | -9.16ms | -1.78% |
| min | 477.66ms | 494.09ms | -16.43ms | -3.33% |
| max | 531.83ms | 532.48ms | -0.65ms | -0.12% |
| total | 7573.99ms | 7711.41ms | -137.42ms | -1.78% |

