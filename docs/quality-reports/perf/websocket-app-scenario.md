# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0055ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0040ms | 0.0060ms | 100ms | 0.00050ms | PASS | stable (p10 +8% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0022ms | 0.0062ms | 100ms | 0.00050ms | PASS | stable (p10 -7% (閾値未満)、 p95 +111% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0045ms | 0.0082ms | 100ms | 0.00050ms | PASS | stable (p10 -4% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0019ms | 0.0021ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| chat_room_workflow (10 send across 4 providers) | -6160 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 4664 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 56 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 27376 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 5720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0083ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.0051ms |
| min | 0.0055ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0056ms | -0.000041ms | -0.74% |
| p50 | 0.0083ms | 0.0062ms | +0.0021ms | +34.34% |
| p95 | 0.02ms | 0.02ms | +0.00092ms | +5.45% |
| p99 | 0.02ms | 0.02ms | +0.0017ms | +7.27% |
| mean | 0.0099ms | 0.0085ms | +0.0014ms | +16.24% |
| min | 0.0055ms | 0.0056ms | -0.000083ms | -1.49% |
| max | 0.03ms | 0.02ms | +0.0018ms | +7.58% |
| total | 0.20ms | 0.17ms | +0.03ms | +16.24% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0043ms |
| p95 | 0.0060ms |
| p99 | 0.01ms |
| mean | 0.0050ms |
| stdev | 0.0026ms |
| min | 0.0040ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0037ms | +0.00029ms | +7.65% |
| p50 | 0.0043ms | 0.0040ms | +0.00029ms | +7.23% |
| p95 | 0.0060ms | 0.0050ms | +0.0011ms | +21.30% |
| p99 | 0.01ms | 0.0057ms | +0.0083ms | +144.54% |
| mean | 0.0050ms | 0.0042ms | +0.00082ms | +19.54% |
| min | 0.0040ms | 0.0037ms | +0.00025ms | +6.74% |
| max | 0.02ms | 0.0059ms | +0.01ms | +170.41% |
| total | 0.10ms | 0.08ms | +0.02ms | +19.54% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0062ms |
| p99 | 0.0065ms |
| mean | 0.0028ms |
| stdev | 0.0012ms |
| min | 0.0022ms |
| max | 0.0066ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0024ms | -0.00017ms | -7.20% |
| p50 | 0.0024ms | 0.0025ms | -0.00010ms | -4.21% |
| p95 | 0.0062ms | 0.0029ms | +0.0033ms | +111.45% |
| p99 | 0.0065ms | 0.0031ms | +0.0035ms | +111.90% |
| mean | 0.0028ms | 0.0025ms | +0.00027ms | +10.69% |
| min | 0.0022ms | 0.0024ms | -0.00021ms | -8.76% |
| max | 0.0066ms | 0.0031ms | +0.0035ms | +112.00% |
| total | 0.06ms | 0.05ms | +0.0054ms | +10.69% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0052ms |
| p95 | 0.0082ms |
| p99 | 0.0090ms |
| mean | 0.0057ms |
| stdev | 0.0015ms |
| min | 0.0040ms |
| max | 0.0092ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0047ms | -0.00020ms | -4.26% |
| p50 | 0.0052ms | 0.0048ms | +0.00044ms | +9.08% |
| p95 | 0.0082ms | 0.0068ms | +0.0014ms | +20.20% |
| p99 | 0.0090ms | 0.0070ms | +0.0020ms | +28.58% |
| mean | 0.0057ms | 0.0053ms | +0.00044ms | +8.23% |
| min | 0.0040ms | 0.0047ms | -0.00071ms | -15.17% |
| max | 0.0092ms | 0.0071ms | +0.0022ms | +30.59% |
| total | 0.11ms | 0.11ms | +0.0087ms | +8.23% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0019ms |
| p95 | 0.0021ms |
| p99 | 0.0030ms |
| mean | 0.0020ms |
| stdev | 0.00028ms |
| min | 0.0018ms |
| max | 0.0032ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | -0.000045ms | -2.36% |
| p50 | 0.0019ms | 0.0020ms | -0.000042ms | -2.14% |
| p95 | 0.0021ms | 0.0022ms | -0.000068ms | -3.16% |
| p99 | 0.0030ms | 0.0028ms | +0.00015ms | +5.48% |
| mean | 0.0020ms | 0.0020ms | -0.000048ms | -2.37% |
| min | 0.0018ms | 0.0019ms | -0.000042ms | -2.24% |
| max | 0.0032ms | 0.0030ms | +0.00021ms | +7.07% |
| total | 0.04ms | 0.04ms | -0.00096ms | -2.37% |

