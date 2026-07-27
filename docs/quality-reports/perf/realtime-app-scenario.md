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
| chat_room_broadcast (subscribe + 20 publish) | 0.08ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.05ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -17528 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | -11368 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | -80 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.04ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -1.51% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +7.50% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +10.85% |
| mean | 0.02ms | 0.02ms | +0.00ms | +5.92% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.98% |
| max | 0.04ms | 0.03ms | +0.00ms | +11.59% |
| total | 0.30ms | 0.28ms | +0.02ms | +5.92% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.37% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -13.18% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -14.51% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.10% |
| min | 0.01ms | 0.01ms | -0.00ms | -12.19% |
| max | 0.02ms | 0.02ms | -0.00ms | -14.77% |
| total | 0.18ms | 0.19ms | -0.01ms | -5.10% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.06% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +39.64% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +88.22% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.12% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.10% |
| max | 0.01ms | 0.01ms | +0.01ms | +100.02% |
| total | 0.07ms | 0.07ms | +0.01ms | +10.12% |

