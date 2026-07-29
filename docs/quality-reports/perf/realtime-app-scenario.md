# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.0097ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0031ms | 0.0067ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.06ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.04ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -32096 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | -728 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0052ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0056ms | -29.27% |
| p50 | 0.02ms | 0.02ms | -0.0054ms | -23.21% |
| p95 | 0.03ms | 0.03ms | -0.0077ms | -22.28% |
| p99 | 0.03ms | 0.04ms | -0.0080ms | -20.44% |
| mean | 0.02ms | 0.02ms | -0.0064ms | -25.94% |
| min | 0.01ms | 0.02ms | -0.0053ms | -29.29% |
| max | 0.03ms | 0.04ms | -0.0080ms | -20.04% |
| total | 0.28ms | 0.37ms | -0.10ms | -25.94% |

### presence_workload (trackPresence 10 users + untrack)

# Perf Report — presence_workload (trackPresence 10 users + untrack).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0021ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.01ms | -0.0024ms | -19.72% |
| p50 | 0.01ms | 0.01ms | -0.0012ms | -9.40% |
| p95 | 0.02ms | 0.02ms | -0.0047ms | -23.85% |
| p99 | 0.02ms | 0.03ms | -0.0085ms | -33.69% |
| mean | 0.01ms | 0.01ms | -0.0024ms | -17.21% |
| min | 0.0097ms | 0.01ms | -0.0024ms | -19.73% |
| max | 0.02ms | 0.03ms | -0.0095ms | -35.51% |
| total | 0.17ms | 0.21ms | -0.04ms | -17.21% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0039ms |
| p95 | 0.0067ms |
| p99 | 0.0068ms |
| mean | 0.0041ms |
| stdev | 0.0012ms |
| min | 0.0031ms |
| max | 0.0068ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0043ms | -0.0012ms | -27.61% |
| p50 | 0.0039ms | 0.0044ms | -0.00050ms | -11.43% |
| p95 | 0.0067ms | 0.0069ms | -0.00021ms | -3.04% |
| p99 | 0.0068ms | 0.0075ms | -0.00068ms | -9.04% |
| mean | 0.0041ms | 0.0048ms | -0.00071ms | -14.70% |
| min | 0.0031ms | 0.0043ms | -0.0012ms | -27.46% |
| max | 0.0068ms | 0.0076ms | -0.00079ms | -10.39% |
| total | 0.06ms | 0.07ms | -0.01ms | -14.70% |

