# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0096ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0057ms | 0.0085ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0026ms | 0.0034ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0047ms | 0.0067ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0019ms | 0.0030ms | 100ms | 0.00050ms | PASS | stable (p10 +0% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.04ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.03ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.01ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.03ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 6768 B | -15163 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 5152 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 632 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 30464 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 18784 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.0098ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0049ms |
| min | 0.0095ms |
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.0056ms | +0.0040ms | +71.65% |
| p50 | 0.0098ms | 0.0062ms | +0.0036ms | +58.25% |
| p95 | 0.01ms | 0.02ms | -0.0026ms | -15.60% |
| p99 | 0.03ms | 0.02ms | +0.0054ms | +23.64% |
| mean | 0.01ms | 0.0085ms | +0.0029ms | +33.67% |
| min | 0.0095ms | 0.0056ms | +0.0039ms | +70.16% |
| max | 0.03ms | 0.02ms | +0.0074ms | +30.51% |
| total | 0.23ms | 0.17ms | +0.06ms | +33.67% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0065ms |
| p95 | 0.0085ms |
| p99 | 0.01ms |
| mean | 0.0067ms |
| stdev | 0.0012ms |
| min | 0.0052ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0037ms | +0.0020ms | +53.00% |
| p50 | 0.0065ms | 0.0040ms | +0.0025ms | +61.86% |
| p95 | 0.0085ms | 0.0050ms | +0.0035ms | +70.79% |
| p99 | 0.01ms | 0.0057ms | +0.0044ms | +76.87% |
| mean | 0.0067ms | 0.0042ms | +0.0026ms | +61.36% |
| min | 0.0052ms | 0.0037ms | +0.0015ms | +40.48% |
| max | 0.01ms | 0.0059ms | +0.0046ms | +78.15% |
| total | 0.13ms | 0.08ms | +0.05ms | +61.36% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0034ms |
| p99 | 0.0036ms |
| mean | 0.0028ms |
| stdev | 0.00030ms |
| min | 0.0025ms |
| max | 0.0037ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0024ms | +0.00021ms | +8.76% |
| p50 | 0.0027ms | 0.0025ms | +0.00021ms | +8.46% |
| p95 | 0.0034ms | 0.0029ms | +0.00046ms | +15.79% |
| p99 | 0.0036ms | 0.0031ms | +0.00053ms | +17.05% |
| mean | 0.0028ms | 0.0025ms | +0.00023ms | +8.88% |
| min | 0.0025ms | 0.0024ms | +0.00017ms | +7.03% |
| max | 0.0037ms | 0.0031ms | +0.00054ms | +17.34% |
| total | 0.06ms | 0.05ms | +0.0045ms | +8.88% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0047ms |
| p50 | 0.0049ms |
| p95 | 0.0067ms |
| p99 | 0.0072ms |
| mean | 0.0053ms |
| stdev | 0.00076ms |
| min | 0.0047ms |
| max | 0.0074ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0047ms | +0.0000041ms | +0.09% |
| p50 | 0.0049ms | 0.0048ms | +0.00010ms | +2.16% |
| p95 | 0.0067ms | 0.0068ms | -0.00014ms | -2.12% |
| p99 | 0.0072ms | 0.0070ms | +0.00020ms | +2.91% |
| mean | 0.0053ms | 0.0053ms | +0.000033ms | +0.63% |
| min | 0.0047ms | 0.0047ms | +0.000042ms | +0.90% |
| max | 0.0074ms | 0.0071ms | +0.00029ms | +4.12% |
| total | 0.11ms | 0.11ms | +0.00067ms | +0.63% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0030ms |
| p99 | 0.0031ms |
| mean | 0.0021ms |
| stdev | 0.00034ms |
| min | 0.0019ms |
| max | 0.0031ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | +0.0000010ms | +0.05% |
| p50 | 0.0020ms | 0.0020ms | +5.0e-7ms | +0.03% |
| p95 | 0.0030ms | 0.0022ms | +0.00080ms | +36.81% |
| p99 | 0.0031ms | 0.0028ms | +0.00026ms | +9.30% |
| mean | 0.0021ms | 0.0020ms | +0.000079ms | +3.93% |
| min | 0.0019ms | 0.0019ms | +0.000041ms | +2.19% |
| max | 0.0031ms | 0.0030ms | +0.00013ms | +4.26% |
| total | 0.04ms | 0.04ms | +0.0016ms | +3.93% |

