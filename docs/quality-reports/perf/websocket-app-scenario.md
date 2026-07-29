# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0061ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0038ms | 0.0054ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0024ms | 0.0058ms | 100ms | 0.00050ms | PASS | stable (p10 0% (閾値未満)、 p95 +99% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0050ms | 0.0075ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0022ms | 0.0026ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.04ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.03ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.01ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.03ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 9240 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 4256 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | -720 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 13840 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 5720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0061ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0048ms |
| min | 0.0057ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0056ms | +0.00048ms | +8.58% |
| p50 | 0.01ms | 0.0062ms | +0.0040ms | +65.33% |
| p95 | 0.02ms | 0.02ms | +0.00044ms | +2.62% |
| p99 | 0.02ms | 0.02ms | +0.0021ms | +9.34% |
| mean | 0.01ms | 0.0085ms | +0.0022ms | +26.14% |
| min | 0.0057ms | 0.0056ms | +0.00017ms | +2.99% |
| max | 0.03ms | 0.02ms | +0.0025ms | +10.51% |
| total | 0.22ms | 0.17ms | +0.04ms | +26.14% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0042ms |
| p95 | 0.0054ms |
| p99 | 0.0068ms |
| mean | 0.0044ms |
| stdev | 0.00078ms |
| min | 0.0038ms |
| max | 0.0071ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0037ms | +0.000042ms | +1.12% |
| p50 | 0.0042ms | 0.0040ms | +0.00019ms | +4.65% |
| p95 | 0.0054ms | 0.0050ms | +0.00046ms | +9.19% |
| p99 | 0.0068ms | 0.0057ms | +0.0011ms | +18.47% |
| mean | 0.0044ms | 0.0042ms | +0.00024ms | +5.69% |
| min | 0.0038ms | 0.0037ms | +0.000084ms | +2.27% |
| max | 0.0071ms | 0.0059ms | +0.0012ms | +20.42% |
| total | 0.09ms | 0.08ms | +0.0048ms | +5.69% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0026ms |
| p95 | 0.0058ms |
| p99 | 0.0065ms |
| mean | 0.0030ms |
| stdev | 0.0012ms |
| min | 0.0023ms |
| max | 0.0067ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | 0.00ms | 0.00% |
| p50 | 0.0026ms | 0.0025ms | +0.00012ms | +5.09% |
| p95 | 0.0058ms | 0.0029ms | +0.0029ms | +99.42% |
| p99 | 0.0065ms | 0.0031ms | +0.0034ms | +111.76% |
| mean | 0.0030ms | 0.0025ms | +0.00044ms | +17.17% |
| min | 0.0023ms | 0.0024ms | -0.000041ms | -1.73% |
| max | 0.0067ms | 0.0031ms | +0.0036ms | +114.66% |
| total | 0.06ms | 0.05ms | +0.0087ms | +17.17% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0052ms |
| p95 | 0.0075ms |
| p99 | 0.0081ms |
| mean | 0.0057ms |
| stdev | 0.00096ms |
| min | 0.0050ms |
| max | 0.0083ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0047ms | +0.00034ms | +7.17% |
| p50 | 0.0052ms | 0.0048ms | +0.00042ms | +8.66% |
| p95 | 0.0075ms | 0.0068ms | +0.00069ms | +10.18% |
| p99 | 0.0081ms | 0.0070ms | +0.0011ms | +15.74% |
| mean | 0.0057ms | 0.0053ms | +0.00045ms | +8.58% |
| min | 0.0050ms | 0.0047ms | +0.00033ms | +7.16% |
| max | 0.0083ms | 0.0071ms | +0.0012ms | +17.07% |
| total | 0.11ms | 0.11ms | +0.0091ms | +8.58% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0022ms |
| p95 | 0.0026ms |
| p99 | 0.0035ms |
| mean | 0.0023ms |
| stdev | 0.00035ms |
| min | 0.0022ms |
| max | 0.0038ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0019ms | +0.00029ms | +15.24% |
| p50 | 0.0022ms | 0.0020ms | +0.00029ms | +14.88% |
| p95 | 0.0026ms | 0.0022ms | +0.00040ms | +18.37% |
| p99 | 0.0035ms | 0.0028ms | +0.00075ms | +26.67% |
| mean | 0.0023ms | 0.0020ms | +0.00032ms | +15.88% |
| min | 0.0022ms | 0.0019ms | +0.00033ms | +17.76% |
| max | 0.0038ms | 0.0030ms | +0.00083ms | +28.19% |
| total | 0.05ms | 0.04ms | +0.0064ms | +15.88% |

