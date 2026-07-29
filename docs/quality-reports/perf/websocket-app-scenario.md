# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0055ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0052ms | 0.0073ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0022ms | 0.0037ms | 100ms | 0.00050ms | PASS | stable (p10 -7% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0044ms | 0.0080ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0019ms | 0.0022ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| chat_room_workflow (10 send across 4 providers) | -5184 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 10000 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 632 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 22424 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 4104 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0078ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0087ms |
| stdev | 0.0046ms |
| min | 0.0054ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0056ms | -0.000087ms | -1.56% |
| p50 | 0.0078ms | 0.0062ms | +0.0016ms | +26.60% |
| p95 | 0.01ms | 0.02ms | -0.0024ms | -14.23% |
| p99 | 0.02ms | 0.02ms | +0.00025ms | +1.11% |
| mean | 0.0087ms | 0.0085ms | +0.00019ms | +2.20% |
| min | 0.0054ms | 0.0056ms | -0.00017ms | -2.97% |
| max | 0.03ms | 0.02ms | +0.00092ms | +3.79% |
| total | 0.17ms | 0.17ms | +0.0038ms | +2.20% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0063ms |
| p95 | 0.0073ms |
| p99 | 0.0073ms |
| mean | 0.0062ms |
| stdev | 0.00080ms |
| min | 0.0046ms |
| max | 0.0073ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0037ms | +0.0014ms | +37.79% |
| p50 | 0.0063ms | 0.0040ms | +0.0023ms | +56.19% |
| p95 | 0.0073ms | 0.0050ms | +0.0023ms | +46.85% |
| p99 | 0.0073ms | 0.0057ms | +0.0016ms | +27.91% |
| mean | 0.0062ms | 0.0042ms | +0.0020ms | +47.21% |
| min | 0.0046ms | 0.0037ms | +0.00092ms | +24.73% |
| max | 0.0073ms | 0.0059ms | +0.0014ms | +23.93% |
| total | 0.12ms | 0.08ms | +0.04ms | +47.21% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0025ms |
| p95 | 0.0037ms |
| p99 | 0.0064ms |
| mean | 0.0027ms |
| stdev | 0.0011ms |
| min | 0.0022ms |
| max | 0.0071ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0024ms | -0.00017ms | -7.21% |
| p50 | 0.0025ms | 0.0025ms | +5.0e-7ms | +0.02% |
| p95 | 0.0037ms | 0.0029ms | +0.00075ms | +25.75% |
| p99 | 0.0064ms | 0.0031ms | +0.0034ms | +108.60% |
| mean | 0.0027ms | 0.0025ms | +0.00017ms | +6.66% |
| min | 0.0022ms | 0.0024ms | -0.00021ms | -8.80% |
| max | 0.0071ms | 0.0031ms | +0.0040ms | +128.00% |
| total | 0.05ms | 0.05ms | +0.0034ms | +6.66% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0045ms |
| p95 | 0.0080ms |
| p99 | 0.0083ms |
| mean | 0.0053ms |
| stdev | 0.0013ms |
| min | 0.0043ms |
| max | 0.0083ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0047ms | -0.00033ms | -7.01% |
| p50 | 0.0045ms | 0.0048ms | -0.00029ms | -6.05% |
| p95 | 0.0080ms | 0.0068ms | +0.0012ms | +17.21% |
| p99 | 0.0083ms | 0.0070ms | +0.0012ms | +17.56% |
| mean | 0.0053ms | 0.0053ms | -0.0000061ms | -0.12% |
| min | 0.0043ms | 0.0047ms | -0.00033ms | -7.12% |
| max | 0.0083ms | 0.0071ms | +0.0013ms | +17.65% |
| total | 0.11ms | 0.11ms | -0.00012ms | -0.12% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0022ms |
| p99 | 0.0030ms |
| mean | 0.0020ms |
| stdev | 0.00029ms |
| min | 0.0019ms |
| max | 0.0032ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | +0.0000010ms | +0.05% |
| p50 | 0.0020ms | 0.0020ms | -5.0e-7ms | -0.03% |
| p95 | 0.0022ms | 0.0022ms | +0.000054ms | +2.52% |
| p99 | 0.0030ms | 0.0028ms | +0.00024ms | +8.73% |
| mean | 0.0020ms | 0.0020ms | +0.0000084ms | +0.42% |
| min | 0.0019ms | 0.0019ms | +0.000041ms | +2.19% |
| max | 0.0032ms | 0.0030ms | +0.00029ms | +9.87% |
| total | 0.04ms | 0.04ms | +0.00017ms | +0.42% |

