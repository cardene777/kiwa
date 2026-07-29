# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0055ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0040ms | 0.0073ms | 100ms | 0.00049ms | PASS | stable (p10 +6% (閾値未満)、 p95 +46% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0022ms | 0.0053ms | 100ms | 0.00049ms | PASS | stable (p10 -9% (閾値未満)、 p95 +81% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0038ms | 0.0088ms | 100ms | 0.00049ms | PASS | stable (p10 -19% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0019ms | 0.0021ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.03ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.01ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.02ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | -3720 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 409424 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 280 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 10384 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 4424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0091ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0090ms |
| stdev | 0.0045ms |
| min | 0.0055ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0056ms | -0.000087ms | -1.56% |
| p50 | 0.0091ms | 0.0062ms | +0.0029ms | +47.14% |
| p95 | 0.02ms | 0.02ms | -0.0015ms | -8.67% |
| p99 | 0.02ms | 0.02ms | -0.00033ms | -1.44% |
| mean | 0.0090ms | 0.0085ms | +0.00042ms | +4.95% |
| min | 0.0055ms | 0.0056ms | -0.00013ms | -2.24% |
| max | 0.02ms | 0.02ms | -0.000042ms | -0.17% |
| total | 0.18ms | 0.17ms | +0.0085ms | +4.95% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0041ms |
| p95 | 0.0073ms |
| p99 | 0.0081ms |
| mean | 0.0046ms |
| stdev | 0.0011ms |
| min | 0.0039ms |
| max | 0.0083ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0037ms | +0.00021ms | +5.57% |
| p50 | 0.0041ms | 0.0040ms | +0.000042ms | +1.04% |
| p95 | 0.0073ms | 0.0050ms | +0.0023ms | +46.21% |
| p99 | 0.0081ms | 0.0057ms | +0.0024ms | +41.19% |
| mean | 0.0046ms | 0.0042ms | +0.00042ms | +10.02% |
| min | 0.0039ms | 0.0037ms | +0.00021ms | +5.61% |
| max | 0.0083ms | 0.0059ms | +0.0024ms | +40.14% |
| total | 0.09ms | 0.08ms | +0.0084ms | +10.02% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0053ms |
| p99 | 0.0067ms |
| mean | 0.0027ms |
| stdev | 0.0012ms |
| min | 0.0021ms |
| max | 0.0070ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0024ms | -0.00021ms | -8.80% |
| p50 | 0.0023ms | 0.0025ms | -0.00019ms | -7.63% |
| p95 | 0.0053ms | 0.0029ms | +0.0024ms | +81.04% |
| p99 | 0.0067ms | 0.0031ms | +0.0036ms | +116.91% |
| mean | 0.0027ms | 0.0025ms | +0.00016ms | +6.15% |
| min | 0.0021ms | 0.0024ms | -0.00025ms | -10.53% |
| max | 0.0070ms | 0.0031ms | +0.0039ms | +125.31% |
| total | 0.05ms | 0.05ms | +0.0031ms | +6.15% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0046ms |
| p95 | 0.0088ms |
| p99 | 0.0091ms |
| mean | 0.0055ms |
| stdev | 0.0018ms |
| min | 0.0037ms |
| max | 0.0091ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0047ms | -0.00088ms | -18.62% |
| p50 | 0.0046ms | 0.0048ms | -0.00021ms | -4.32% |
| p95 | 0.0088ms | 0.0068ms | +0.0020ms | +29.40% |
| p99 | 0.0091ms | 0.0070ms | +0.0020ms | +28.94% |
| mean | 0.0055ms | 0.0053ms | +0.00022ms | +4.13% |
| min | 0.0037ms | 0.0047ms | -0.00092ms | -19.63% |
| max | 0.0091ms | 0.0071ms | +0.0020ms | +28.83% |
| total | 0.11ms | 0.11ms | +0.0044ms | +4.13% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0021ms |
| p99 | 0.0028ms |
| mean | 0.0020ms |
| stdev | 0.00024ms |
| min | 0.0019ms |
| max | 0.0030ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | 0.00ms | 0.00% |
| p50 | 0.0020ms | 0.0020ms | 0.00ms | 0.00% |
| p95 | 0.0021ms | 0.0022ms | -0.000037ms | -1.70% |
| p99 | 0.0028ms | 0.0028ms | +0.000026ms | +0.94% |
| mean | 0.0020ms | 0.0020ms | -0.000010ms | -0.51% |
| min | 0.0019ms | 0.0019ms | 0.00ms | 0.00% |
| max | 0.0030ms | 0.0030ms | +0.000042ms | +1.42% |
| total | 0.04ms | 0.04ms | -0.00021ms | -0.51% |

