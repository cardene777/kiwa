# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0038ms | 0.0059ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.07ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.04ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -31608 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | 616 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 11120 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_broadcast (subscribe + 20 publish)

# Perf Report — chat_room_broadcast (subscribe + 20 publish).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0060ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0049ms | -25.95% |
| p50 | 0.02ms | 0.02ms | -0.0045ms | -19.46% |
| p95 | 0.03ms | 0.03ms | -0.0050ms | -14.46% |
| p99 | 0.04ms | 0.04ms | -0.0040ms | -10.16% |
| mean | 0.02ms | 0.02ms | -0.0051ms | -20.63% |
| min | 0.01ms | 0.02ms | -0.0051ms | -28.15% |
| max | 0.04ms | 0.04ms | -0.0037ms | -9.24% |
| total | 0.30ms | 0.37ms | -0.08ms | -20.63% |

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
| stdev | 0.0023ms |
| min | 0.0099ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0021ms | -17.39% |
| p50 | 0.01ms | 0.01ms | -0.0020ms | -16.12% |
| p95 | 0.02ms | 0.02ms | -0.0040ms | -20.08% |
| p99 | 0.02ms | 0.03ms | -0.0087ms | -34.16% |
| mean | 0.01ms | 0.01ms | -0.0022ms | -16.09% |
| min | 0.0099ms | 0.01ms | -0.0021ms | -17.65% |
| max | 0.02ms | 0.03ms | -0.0098ms | -36.76% |
| total | 0.18ms | 0.21ms | -0.03ms | -16.09% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0040ms |
| p95 | 0.0059ms |
| p99 | 0.0077ms |
| mean | 0.0043ms |
| stdev | 0.0011ms |
| min | 0.0038ms |
| max | 0.0081ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0043ms | -0.00045ms | -10.50% |
| p50 | 0.0040ms | 0.0044ms | -0.00042ms | -9.53% |
| p95 | 0.0059ms | 0.0069ms | -0.00094ms | -13.72% |
| p99 | 0.0077ms | 0.0075ms | +0.00018ms | +2.38% |
| mean | 0.0043ms | 0.0048ms | -0.00054ms | -11.19% |
| min | 0.0038ms | 0.0043ms | -0.00046ms | -10.78% |
| max | 0.0081ms | 0.0076ms | +0.00046ms | +6.01% |
| total | 0.06ms | 0.07ms | -0.0081ms | -11.19% |

