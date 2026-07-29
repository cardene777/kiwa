# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0055ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0040ms | 0.0052ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0022ms | 0.0068ms | 100ms | 0.00050ms | PASS | stable (p10 -5% (閾値未満)、 p95 +132% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0043ms | 0.0094ms | 100ms | 0.00050ms | PASS | stable (p10 -8% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0020ms | 0.0027ms | 100ms | 0.00050ms | PASS | stable (p10 +2% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.02ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.01ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.02ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | -6832 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 3624 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 712 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 26936 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 3104 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0068ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0084ms |
| stdev | 0.0042ms |
| min | 0.0055ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0056ms | -0.000083ms | -1.49% |
| p50 | 0.0068ms | 0.0062ms | +0.00065ms | +10.44% |
| p95 | 0.02ms | 0.02ms | -0.00086ms | -5.07% |
| p99 | 0.02ms | 0.02ms | -0.0019ms | -8.24% |
| mean | 0.0084ms | 0.0085ms | -0.00012ms | -1.39% |
| min | 0.0055ms | 0.0056ms | -0.000083ms | -1.49% |
| max | 0.02ms | 0.02ms | -0.0021ms | -8.79% |
| total | 0.17ms | 0.17ms | -0.0024ms | -1.39% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0040ms |
| p95 | 0.0052ms |
| p99 | 0.0063ms |
| mean | 0.0043ms |
| stdev | 0.00061ms |
| min | 0.0040ms |
| max | 0.0066ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0037ms | +0.00025ms | +6.67% |
| p50 | 0.0040ms | 0.0040ms | +5.0e-7ms | +0.01% |
| p95 | 0.0052ms | 0.0050ms | +0.00023ms | +4.69% |
| p99 | 0.0063ms | 0.0057ms | +0.00061ms | +10.70% |
| mean | 0.0043ms | 0.0042ms | +0.00010ms | +2.40% |
| min | 0.0040ms | 0.0037ms | +0.00025ms | +6.74% |
| max | 0.0066ms | 0.0059ms | +0.00071ms | +11.97% |
| total | 0.09ms | 0.08ms | +0.0020ms | +2.40% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0025ms |
| p95 | 0.0068ms |
| p99 | 0.0094ms |
| mean | 0.0033ms |
| stdev | 0.0020ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0024ms | -0.00013ms | -5.26% |
| p50 | 0.0025ms | 0.0025ms | +0.000021ms | +0.87% |
| p95 | 0.0068ms | 0.0029ms | +0.0039ms | +132.15% |
| p99 | 0.0094ms | 0.0031ms | +0.0063ms | +204.42% |
| mean | 0.0033ms | 0.0025ms | +0.00075ms | +29.59% |
| min | 0.0022ms | 0.0024ms | -0.00017ms | -6.99% |
| max | 0.01ms | 0.0031ms | +0.0069ms | +221.34% |
| total | 0.07ms | 0.05ms | +0.02ms | +29.59% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0046ms |
| p95 | 0.0094ms |
| p99 | 0.0097ms |
| mean | 0.0056ms |
| stdev | 0.0018ms |
| min | 0.0043ms |
| max | 0.0098ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0047ms | -0.00038ms | -8.08% |
| p50 | 0.0046ms | 0.0048ms | -0.00023ms | -4.77% |
| p95 | 0.0094ms | 0.0068ms | +0.0026ms | +37.47% |
| p99 | 0.0097ms | 0.0070ms | +0.0027ms | +38.10% |
| mean | 0.0056ms | 0.0053ms | +0.00027ms | +5.19% |
| min | 0.0043ms | 0.0047ms | -0.00042ms | -8.92% |
| max | 0.0098ms | 0.0071ms | +0.0027ms | +38.25% |
| total | 0.11ms | 0.11ms | +0.0055ms | +5.19% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0027ms |
| p99 | 0.0027ms |
| mean | 0.0021ms |
| stdev | 0.00025ms |
| min | 0.0019ms |
| max | 0.0027ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0019ms | +0.000042ms | +2.19% |
| p50 | 0.0020ms | 0.0020ms | +0.000041ms | +2.12% |
| p95 | 0.0027ms | 0.0022ms | +0.00054ms | +25.13% |
| p99 | 0.0027ms | 0.0028ms | -0.000058ms | -2.05% |
| mean | 0.0021ms | 0.0020ms | +0.000092ms | +4.54% |
| min | 0.0019ms | 0.0019ms | +0.000042ms | +2.24% |
| max | 0.0027ms | 0.0030ms | -0.00021ms | -7.03% |
| total | 0.04ms | 0.04ms | +0.0018ms | +4.54% |

