# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00027ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00053ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.02ms | 0.50ms | 100ms | 0.00053ms | PASS | stable (p10 -20% (閾値未満)、 p95 +1354% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.01ms | 0.02ms | 100ms | 0.00053ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0040ms | 0.0061ms | 100ms | 0.00053ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.09ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.05ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.03ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -13248 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | 552 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_broadcast (subscribe + 20 publish)

# Perf Report — chat_room_broadcast (subscribe + 20 publish).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.50ms |
| p99 | 0.51ms |
| mean | 0.10ms |
| stdev | 0.17ms |
| min | 0.01ms |
| max | 0.51ms |
| total | 1.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0039ms | -20.40% |
| p50 | 0.02ms | 0.02ms | +0.00067ms | +2.86% |
| p95 | 0.50ms | 0.03ms | +0.47ms | +1353.96% |
| p99 | 0.51ms | 0.04ms | +0.47ms | +1209.99% |
| mean | 0.10ms | 0.02ms | +0.07ms | +290.40% |
| min | 0.01ms | 0.02ms | -0.0043ms | -23.35% |
| max | 0.51ms | 0.04ms | +0.47ms | +1179.03% |
| total | 1.46ms | 0.37ms | +1.08ms | +290.40% |

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
| stdev | 0.0037ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00068ms | +5.64% |
| p50 | 0.01ms | 0.01ms | +0.0013ms | +10.07% |
| p95 | 0.02ms | 0.02ms | +0.0032ms | +16.05% |
| p99 | 0.02ms | 0.03ms | -0.00046ms | -1.83% |
| mean | 0.01ms | 0.01ms | +0.00089ms | +6.41% |
| min | 0.01ms | 0.01ms | -0.00054ms | -4.50% |
| max | 0.03ms | 0.03ms | -0.0014ms | -5.14% |
| total | 0.22ms | 0.21ms | +0.01ms | +6.41% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0041ms |
| p95 | 0.0061ms |
| p99 | 0.0079ms |
| mean | 0.0045ms |
| stdev | 0.0011ms |
| min | 0.0039ms |
| max | 0.0083ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0043ms | -0.00028ms | -6.61% |
| p50 | 0.0041ms | 0.0044ms | -0.00029ms | -6.65% |
| p95 | 0.0061ms | 0.0069ms | -0.00078ms | -11.35% |
| p99 | 0.0079ms | 0.0075ms | +0.00041ms | +5.49% |
| mean | 0.0045ms | 0.0048ms | -0.00038ms | -7.86% |
| min | 0.0039ms | 0.0043ms | -0.00033ms | -7.84% |
| max | 0.0083ms | 0.0076ms | +0.00071ms | +9.29% |
| total | 0.07ms | 0.07ms | -0.0057ms | -7.86% |

