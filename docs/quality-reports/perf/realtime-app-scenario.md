# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.0095ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0039ms | 0.0059ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.06ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.04ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.08ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -14472 B | -30995 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | -10240 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 472 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0054ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0059ms | -30.89% |
| p50 | 0.02ms | 0.02ms | -0.0047ms | -20.00% |
| p95 | 0.03ms | 0.03ms | -0.0079ms | -22.80% |
| p99 | 0.03ms | 0.04ms | -0.0077ms | -19.76% |
| mean | 0.02ms | 0.02ms | -0.0057ms | -23.10% |
| min | 0.01ms | 0.02ms | -0.0052ms | -28.61% |
| max | 0.03ms | 0.04ms | -0.0077ms | -19.11% |
| total | 0.29ms | 0.37ms | -0.09ms | -23.10% |

### presence_workload (trackPresence 10 users + untrack)

# Perf Report — presence_workload (trackPresence 10 users + untrack).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.01ms | -0.0026ms | -21.85% |
| p50 | 0.01ms | 0.01ms | -0.0020ms | -15.77% |
| p95 | 0.02ms | 0.02ms | -0.0025ms | -12.39% |
| p99 | 0.02ms | 0.03ms | -0.0075ms | -29.54% |
| mean | 0.01ms | 0.01ms | -0.0024ms | -16.85% |
| min | 0.0095ms | 0.01ms | -0.0026ms | -21.46% |
| max | 0.02ms | 0.03ms | -0.0088ms | -32.71% |
| total | 0.17ms | 0.21ms | -0.04ms | -16.85% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0039ms |
| p50 | 0.0040ms |
| p95 | 0.0059ms |
| p99 | 0.0074ms |
| mean | 0.0043ms |
| stdev | 0.0010ms |
| min | 0.0038ms |
| max | 0.0078ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0043ms | -0.00041ms | -9.53% |
| p50 | 0.0040ms | 0.0044ms | -0.00038ms | -8.57% |
| p95 | 0.0059ms | 0.0069ms | -0.00097ms | -14.14% |
| p99 | 0.0074ms | 0.0075ms | -0.000061ms | -0.81% |
| mean | 0.0043ms | 0.0048ms | -0.00051ms | -10.62% |
| min | 0.0038ms | 0.0043ms | -0.00046ms | -10.80% |
| max | 0.0078ms | 0.0076ms | +0.00017ms | +2.19% |
| total | 0.06ms | 0.07ms | -0.0077ms | -10.62% |

