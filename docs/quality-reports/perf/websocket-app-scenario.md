# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0055ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0035ms | 0.0050ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0022ms | 0.0057ms | 100ms | 0.00042ms | PASS | stable (p10 -7% (閾値未満)、 p95 +93% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0043ms | 0.0088ms | 100ms | 0.00042ms | PASS | stable (p10 -10% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0019ms | 0.0022ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.04ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.03ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.01ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.02ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | -282216 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 6744 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | -376 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 26520 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 1720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0088ms |
| stdev | 0.0043ms |
| min | 0.0055ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0056ms | -0.000046ms | -0.83% |
| p50 | 0.0091ms | 0.0062ms | +0.0030ms | +47.81% |
| p95 | 0.01ms | 0.02ms | -0.0028ms | -16.58% |
| p99 | 0.02ms | 0.02ms | -0.00049ms | -2.18% |
| mean | 0.0088ms | 0.0085ms | +0.00028ms | +3.32% |
| min | 0.0055ms | 0.0056ms | -0.000083ms | -1.49% |
| max | 0.02ms | 0.02ms | +0.000083ms | +0.34% |
| total | 0.18ms | 0.17ms | +0.0057ms | +3.32% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0036ms |
| p95 | 0.0050ms |
| p99 | 0.0064ms |
| mean | 0.0039ms |
| stdev | 0.00077ms |
| min | 0.0035ms |
| max | 0.0067ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0037ms | -0.00025ms | -6.67% |
| p50 | 0.0036ms | 0.0040ms | -0.00046ms | -11.32% |
| p95 | 0.0050ms | 0.0050ms | +0.000040ms | +0.80% |
| p99 | 0.0064ms | 0.0057ms | +0.00064ms | +11.19% |
| mean | 0.0039ms | 0.0042ms | -0.00025ms | -5.88% |
| min | 0.0035ms | 0.0037ms | -0.00025ms | -6.74% |
| max | 0.0067ms | 0.0059ms | +0.00079ms | +13.37% |
| total | 0.08ms | 0.08ms | -0.0049ms | -5.88% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0057ms |
| p99 | 0.0068ms |
| mean | 0.0029ms |
| stdev | 0.0012ms |
| min | 0.0022ms |
| max | 0.0071ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0024ms | -0.00017ms | -6.99% |
| p50 | 0.0024ms | 0.0025ms | -0.000041ms | -1.67% |
| p95 | 0.0057ms | 0.0029ms | +0.0027ms | +93.35% |
| p99 | 0.0068ms | 0.0031ms | +0.0037ms | +121.42% |
| mean | 0.0029ms | 0.0025ms | +0.00035ms | +13.72% |
| min | 0.0022ms | 0.0024ms | -0.00017ms | -7.03% |
| max | 0.0071ms | 0.0031ms | +0.0040ms | +128.00% |
| total | 0.06ms | 0.05ms | +0.0070ms | +13.72% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0053ms |
| p95 | 0.0088ms |
| p99 | 0.0089ms |
| mean | 0.0057ms |
| stdev | 0.0015ms |
| min | 0.0037ms |
| max | 0.0089ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0047ms | -0.00045ms | -9.57% |
| p50 | 0.0053ms | 0.0048ms | +0.00050ms | +10.39% |
| p95 | 0.0088ms | 0.0068ms | +0.0019ms | +28.64% |
| p99 | 0.0089ms | 0.0070ms | +0.0018ms | +25.95% |
| mean | 0.0057ms | 0.0053ms | +0.00039ms | +7.40% |
| min | 0.0037ms | 0.0047ms | -0.00092ms | -19.63% |
| max | 0.0089ms | 0.0071ms | +0.0018ms | +25.30% |
| total | 0.11ms | 0.11ms | +0.0078ms | +7.40% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0022ms |
| p99 | 0.0028ms |
| mean | 0.0020ms |
| stdev | 0.00023ms |
| min | 0.0019ms |
| max | 0.0030ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | +9.0e-7ms | +0.05% |
| p50 | 0.0020ms | 0.0020ms | -5.0e-7ms | -0.03% |
| p95 | 0.0022ms | 0.0022ms | +0.000079ms | +3.64% |
| p99 | 0.0028ms | 0.0028ms | +0.000017ms | +0.59% |
| mean | 0.0020ms | 0.0020ms | +0.000021ms | +1.02% |
| min | 0.0019ms | 0.0019ms | +0.000041ms | +2.19% |
| max | 0.0030ms | 0.0030ms | +0.0000010ms | +0.03% |
| total | 0.04ms | 0.04ms | +0.00041ms | +1.02% |

