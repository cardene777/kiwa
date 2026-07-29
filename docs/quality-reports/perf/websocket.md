# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00033ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00029ms | 0.00064ms | 5ms | 0.00033ms | PASS | stable (p10 -13% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00029ms | 0.00039ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -144472 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 6088 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00067ms |
| p99 | 0.0054ms |
| mean | 0.00052ms |
| stdev | 0.00077ms |
| min | 0.00033ms |
| max | 0.0064ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00067ms | 0.00055ms | +0.00012ms | +22.13% |
| p99 | 0.0054ms | 0.0039ms | +0.0015ms | +39.81% |
| mean | 0.00052ms | 0.00047ms | +0.000050ms | +10.54% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0064ms | 0.0058ms | +0.00058ms | +9.99% |
| total | 0.10ms | 0.09ms | +0.01ms | +10.54% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00064ms |
| p99 | 0.0037ms |
| mean | 0.00043ms |
| stdev | 0.00054ms |
| min | 0.00025ms |
| max | 0.0047ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00064ms | 0.00050ms | +0.00014ms | +27.92% |
| p99 | 0.0037ms | 0.0016ms | +0.0021ms | +132.52% |
| mean | 0.00043ms | 0.00041ms | +0.000022ms | +5.41% |
| min | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| max | 0.0047ms | 0.0032ms | +0.0015ms | +47.41% |
| total | 0.09ms | 0.08ms | +0.0044ms | +5.41% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.00039ms |
| p99 | 0.0090ms |
| mean | 0.00055ms |
| stdev | 0.0018ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00039ms | 0.00038ms | +0.000013ms | +3.33% |
| p99 | 0.0090ms | 0.0022ms | +0.0068ms | +316.42% |
| mean | 0.00055ms | 0.00041ms | +0.00014ms | +35.46% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.0086ms | +0.01ms | +137.36% |
| total | 0.11ms | 0.08ms | +0.03ms | +35.46% |

