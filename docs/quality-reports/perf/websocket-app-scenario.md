# Perf Suite — websocket-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.0058ms | 0.0090ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.0048ms | 0.01ms | 100ms | 0.00052ms | PASS | regressed — gate 無効 (regressionGate=false) |
| binary_frame_batch (5 encode + parse round-trip) | 0.0021ms | 0.0025ms | 100ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |
| room_registry_batch (5 room join + broadcast + leave) | 0.0038ms | 0.0086ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.0011ms | 0.0012ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | cpu | 0.08ms | 0.0058ms | 0.071 | 0.073 | 0.0058ms | 0.0060ms |
| broadcast_batch (5 rooms x 3 clients broadcast) | cpu | 0.08ms | 0.0048ms | 0.060 | 0.045 | 0.0051ms | 0.0038ms |
| binary_frame_batch (5 encode + parse round-trip) | cpu | 0.08ms | 0.0021ms | 0.026 | 0.028 | 0.0022ms | 0.0023ms |
| room_registry_batch (5 room join + broadcast + leave) | cpu | 0.08ms | 0.0038ms | 0.046 | 0.047 | 0.0038ms | 0.0039ms |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | cpu | 0.08ms | 0.0011ms | 0.013 | 0.014 | 0.0011ms | 0.0012ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 0.04ms | 200ms | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 0.01ms | 200ms | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 0.02ms | 200ms | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_room_workflow (10 send across 4 providers) | -180184 B | 0 B | 102400 B | yes | PASS |
| broadcast_batch (5 rooms x 3 clients broadcast) | 11280 B | 0 B | 102400 B | yes | PASS |
| binary_frame_batch (5 encode + parse round-trip) | 400 B | 0 B | 102400 B | yes | PASS |
| room_registry_batch (5 room join + broadcast + leave) | 10968 B | 0 B | 102400 B | yes | PASS |
| reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle) | 4208 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_room_workflow (10 send across 4 providers)

# Perf Report — chat_room_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0058ms |
| p50 | 0.0062ms |
| p95 | 0.0090ms |
| p99 | 0.02ms |
| mean | 0.0072ms |
| stdev | 0.0029ms |
| min | 0.0058ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0058ms | 0.0060ms | -0.00020ms | -3.40% |
| p50 | 0.0062ms | 0.0062ms | +0.000042ms | +0.68% |
| p95 | 0.0090ms | 0.0090ms | +0.000076ms | +0.85% |
| p99 | 0.02ms | 0.02ms | -0.0032ms | -15.98% |
| mean | 0.0072ms | 0.0072ms | -0.000092ms | -1.26% |
| min | 0.0058ms | 0.0059ms | -0.00013ms | -2.11% |
| max | 0.02ms | 0.02ms | -0.0040ms | -17.64% |
| total | 0.14ms | 0.14ms | -0.0018ms | -1.26% |

### broadcast_batch (5 rooms x 3 clients broadcast)

# Perf Report — broadcast_batch (5 rooms x 3 clients broadcast).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0048ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0069ms |
| stdev | 0.0035ms |
| min | 0.0047ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0038ms | +0.0010ms | +27.37% |
| p50 | 0.0060ms | 0.0040ms | +0.0020ms | +50.76% |
| p95 | 0.01ms | 0.0049ms | +0.0053ms | +106.45% |
| p99 | 0.02ms | 0.0052ms | +0.01ms | +259.98% |
| mean | 0.0069ms | 0.0042ms | +0.0027ms | +63.05% |
| min | 0.0047ms | 0.0037ms | +0.0010ms | +26.97% |
| max | 0.02ms | 0.0053ms | +0.02ms | +296.04% |
| total | 0.14ms | 0.08ms | +0.05ms | +63.05% |

### binary_frame_batch (5 encode + parse round-trip)

# Perf Report — binary_frame_batch (5 encode + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0025ms |
| p99 | 0.0027ms |
| mean | 0.0022ms |
| stdev | 0.00016ms |
| min | 0.0021ms |
| max | 0.0027ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0023ms | -0.00021ms | -8.94% |
| p50 | 0.0022ms | 0.0024ms | -0.00025ms | -10.32% |
| p95 | 0.0025ms | 0.0031ms | -0.00055ms | -18.06% |
| p99 | 0.0027ms | 0.0047ms | -0.0020ms | -42.66% |
| mean | 0.0022ms | 0.0026ms | -0.00039ms | -14.85% |
| min | 0.0021ms | 0.0023ms | -0.00021ms | -9.12% |
| max | 0.0027ms | 0.0051ms | -0.0024ms | -46.34% |
| total | 0.04ms | 0.05ms | -0.0077ms | -14.85% |

### room_registry_batch (5 room join + broadcast + leave)

# Perf Report — room_registry_batch (5 room join + broadcast + leave).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0039ms |
| p95 | 0.0086ms |
| p99 | 0.0087ms |
| mean | 0.0049ms |
| stdev | 0.0016ms |
| min | 0.0037ms |
| max | 0.0088ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0039ms | -0.000079ms | -2.04% |
| p50 | 0.0039ms | 0.0052ms | -0.0013ms | -25.09% |
| p95 | 0.0086ms | 0.02ms | -0.01ms | -55.81% |
| p99 | 0.0087ms | 0.02ms | -0.01ms | -57.72% |
| mean | 0.0049ms | 0.0069ms | -0.0020ms | -29.10% |
| min | 0.0037ms | 0.0038ms | -0.000083ms | -2.17% |
| max | 0.0088ms | 0.02ms | -0.01ms | -58.17% |
| total | 0.10ms | 0.14ms | -0.04ms | -29.10% |

### reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle)

# Perf Report — reconnect_heartbeat_batch (5 exp-backoff + heartbeat cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0011ms |
| p50 | 0.0011ms |
| p95 | 0.0012ms |
| p99 | 0.0015ms |
| mean | 0.0011ms |
| stdev | 0.00011ms |
| min | 0.0010ms |
| max | 0.0016ms |
| total | 0.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0012ms | -0.000083ms | -7.12% |
| p50 | 0.0011ms | 0.0012ms | -0.000083ms | -6.87% |
| p95 | 0.0012ms | 0.0029ms | -0.0017ms | -59.02% |
| p99 | 0.0015ms | 0.0045ms | -0.0030ms | -66.67% |
| mean | 0.0011ms | 0.0015ms | -0.00041ms | -26.52% |
| min | 0.0010ms | 0.0012ms | -0.00012ms | -10.63% |
| max | 0.0016ms | 0.0049ms | -0.0033ms | -67.80% |
| total | 0.02ms | 0.03ms | -0.0082ms | -26.52% |

