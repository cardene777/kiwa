# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00033ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +167% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00029ms | 0.00075ms | 5ms | 0.00033ms | PASS | stable (p10 -13% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00025ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -8512 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 6008 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 936 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0015ms |
| p99 | 0.0048ms |
| mean | 0.00058ms |
| stdev | 0.00098ms |
| min | 0.00029ms |
| max | 0.010ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.0015ms | 0.00055ms | +0.00091ms | +166.97% |
| p99 | 0.0048ms | 0.0039ms | +0.00093ms | +23.97% |
| mean | 0.00058ms | 0.00047ms | +0.00011ms | +22.44% |
| min | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| max | 0.010ms | 0.0058ms | +0.0041ms | +70.69% |
| total | 0.12ms | 0.09ms | +0.02ms | +22.44% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00075ms |
| p99 | 0.0036ms |
| mean | 0.00044ms |
| stdev | 0.00064ms |
| min | 0.00025ms |
| max | 0.0069ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00075ms | 0.00050ms | +0.00025ms | +50.83% |
| p99 | 0.0036ms | 0.0016ms | +0.0020ms | +124.56% |
| mean | 0.00044ms | 0.00041ms | +0.000034ms | +8.31% |
| min | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| max | 0.0069ms | 0.0032ms | +0.0037ms | +117.15% |
| total | 0.09ms | 0.08ms | +0.0068ms | +8.31% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.0016ms |
| p99 | 0.0079ms |
| mean | 0.00059ms |
| stdev | 0.0014ms |
| min | 0.00021ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.0016ms | 0.00038ms | +0.0013ms | +332.08% |
| p99 | 0.0079ms | 0.0022ms | +0.0058ms | +267.48% |
| mean | 0.00059ms | 0.00041ms | +0.00019ms | +46.50% |
| min | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| max | 0.01ms | 0.0086ms | +0.0060ms | +70.38% |
| total | 0.12ms | 0.08ms | +0.04ms | +46.50% |

