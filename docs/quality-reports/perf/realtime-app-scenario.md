# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0032ms | 0.0096ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.07ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.05ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -29104 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | 328 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 12344 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0055ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0059ms | -31.15% |
| p50 | 0.02ms | 0.02ms | -0.0061ms | -26.07% |
| p95 | 0.03ms | 0.03ms | -0.0066ms | -19.24% |
| p99 | 0.03ms | 0.04ms | -0.0075ms | -19.30% |
| mean | 0.02ms | 0.02ms | -0.0061ms | -24.36% |
| min | 0.01ms | 0.02ms | -0.0054ms | -29.75% |
| max | 0.03ms | 0.04ms | -0.0077ms | -19.31% |
| total | 0.28ms | 0.37ms | -0.09ms | -24.36% |

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
| stdev | 0.0024ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0021ms | -17.18% |
| p50 | 0.01ms | 0.01ms | -0.0020ms | -16.45% |
| p95 | 0.02ms | 0.02ms | -0.0030ms | -15.13% |
| p99 | 0.02ms | 0.03ms | -0.0085ms | -33.52% |
| mean | 0.01ms | 0.01ms | -0.0024ms | -17.37% |
| min | 0.01ms | 0.01ms | -0.0020ms | -16.96% |
| max | 0.02ms | 0.03ms | -0.0099ms | -36.92% |
| total | 0.17ms | 0.21ms | -0.04ms | -17.37% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0032ms |
| p50 | 0.0038ms |
| p95 | 0.0096ms |
| p99 | 0.02ms |
| mean | 0.0048ms |
| stdev | 0.0035ms |
| min | 0.0032ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0043ms | -0.0010ms | -24.12% |
| p50 | 0.0038ms | 0.0044ms | -0.00054ms | -12.37% |
| p95 | 0.0096ms | 0.0069ms | +0.0028ms | +40.41% |
| p99 | 0.02ms | 0.0075ms | +0.0080ms | +106.44% |
| mean | 0.0048ms | 0.0048ms | -0.000036ms | -0.74% |
| min | 0.0032ms | 0.0043ms | -0.0010ms | -24.52% |
| max | 0.02ms | 0.0076ms | +0.0093ms | +121.31% |
| total | 0.07ms | 0.07ms | -0.00054ms | -0.74% |

