# Perf Suite — realtime-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| presence_workload (trackPresence 10 users + untrack) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.0039ms | 0.0083ms | 100ms | 0.00050ms | PASS | stable (p10 -9% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | 0.08ms | 200ms | PASS |
| presence_workload (trackPresence 10 users + untrack) | 0.05ms | 200ms | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 0.02ms | 200ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_broadcast (subscribe + 20 publish) | -14792 B | 0 B | 102400 B | yes | PASS |
| presence_workload (trackPresence 10 users + untrack) | 392 B | 0 B | 102400 B | yes | PASS |
| reconnect_resilience (5x connect/disconnect/reconnect) | 1080 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0059ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0050ms | -26.30% |
| p50 | 0.02ms | 0.02ms | -0.0045ms | -19.29% |
| p95 | 0.03ms | 0.03ms | -0.0056ms | -16.18% |
| p99 | 0.03ms | 0.04ms | -0.0046ms | -11.75% |
| mean | 0.02ms | 0.02ms | -0.0047ms | -18.80% |
| min | 0.01ms | 0.02ms | -0.0053ms | -28.84% |
| max | 0.04ms | 0.04ms | -0.0043ms | -10.80% |
| total | 0.30ms | 0.37ms | -0.07ms | -18.80% |

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
| stdev | 0.0022ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0020ms | -16.15% |
| p50 | 0.01ms | 0.01ms | -0.0013ms | -10.07% |
| p95 | 0.02ms | 0.02ms | -0.0038ms | -19.42% |
| p99 | 0.02ms | 0.03ms | -0.0086ms | -33.93% |
| mean | 0.01ms | 0.01ms | -0.0021ms | -15.20% |
| min | 0.01ms | 0.01ms | -0.0020ms | -16.27% |
| max | 0.02ms | 0.03ms | -0.0098ms | -36.61% |
| total | 0.18ms | 0.21ms | -0.03ms | -15.20% |

### reconnect_resilience (5x connect/disconnect/reconnect)

# Perf Report — reconnect_resilience (5x connect/disconnect/reconnect).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.0039ms |
| p50 | 0.0040ms |
| p95 | 0.0083ms |
| p99 | 0.0088ms |
| mean | 0.0047ms |
| stdev | 0.0016ms |
| min | 0.0038ms |
| max | 0.0089ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0043ms | -0.00037ms | -8.56% |
| p50 | 0.0040ms | 0.0044ms | -0.00038ms | -8.57% |
| p95 | 0.0083ms | 0.0069ms | +0.0014ms | +20.93% |
| p99 | 0.0088ms | 0.0075ms | +0.0013ms | +17.67% |
| mean | 0.0047ms | 0.0048ms | -0.00012ms | -2.47% |
| min | 0.0038ms | 0.0043ms | -0.00046ms | -10.80% |
| max | 0.0089ms | 0.0076ms | +0.0013ms | +16.93% |
| total | 0.07ms | 0.07ms | -0.0018ms | -2.47% |

