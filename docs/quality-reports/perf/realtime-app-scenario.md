# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0034ms | 0.0077ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.08ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.08ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -32032 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | -728 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 808 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_broadcast (subscribe + 20 publish)

# Perf Report — chat_room_broadcast (subscribe + 20 publish).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0052ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0024ms | -12.58% |
| p50 | 0.02ms | 0.02ms | -0.0035ms | -15.18% |
| p95 | 0.03ms | 0.03ms | -0.0047ms | -13.54% |
| p99 | 0.03ms | 0.04ms | -0.0048ms | -12.23% |
| mean | 0.02ms | 0.02ms | -0.0039ms | -15.52% |
| min | 0.01ms | 0.02ms | -0.0037ms | -20.14% |
| max | 0.04ms | 0.04ms | -0.0048ms | -11.94% |
| total | 0.31ms | 0.37ms | -0.06ms | -15.52% |

### presence_workload (trackPresence 10 users + untrack)

# Perf Report — presence_workload (trackPresence 10 users + untrack).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0099ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0020ms | -16.29% |
| p50 | 0.01ms | 0.01ms | -0.0017ms | -13.43% |
| p95 | 0.02ms | 0.02ms | -0.0024ms | -11.99% |
| p99 | 0.02ms | 0.03ms | -0.0078ms | -30.79% |
| mean | 0.01ms | 0.01ms | -0.0019ms | -13.42% |
| min | 0.0099ms | 0.01ms | -0.0021ms | -17.65% |
| max | 0.02ms | 0.03ms | -0.0092ms | -34.27% |
| total | 0.18ms | 0.21ms | -0.03ms | -13.42% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0040ms |
| p95 | 0.0077ms |
| p99 | 0.0084ms |
| mean | 0.0046ms |
| stdev | 0.0015ms |
| min | 0.0034ms |
| max | 0.0086ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0043ms | -0.00086ms | -20.04% |
| p50 | 0.0040ms | 0.0044ms | -0.00038ms | -8.57% |
| p95 | 0.0077ms | 0.0069ms | +0.00081ms | +11.82% |
| p99 | 0.0084ms | 0.0075ms | +0.00093ms | +12.43% |
| mean | 0.0046ms | 0.0048ms | -0.00025ms | -5.17% |
| min | 0.0034ms | 0.0043ms | -0.00088ms | -20.59% |
| max | 0.0086ms | 0.0076ms | +0.00096ms | +12.56% |
| total | 0.07ms | 0.07ms | -0.0038ms | -5.17% |

