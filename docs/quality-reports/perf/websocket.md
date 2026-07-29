# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00038ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (p10 +13% (閾値未満)、 p95 +129% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00029ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable (p10 -12% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00029ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -383984 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 12392 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0013ms |
| p99 | 0.0041ms |
| mean | 0.00055ms |
| stdev | 0.00062ms |
| min | 0.00033ms |
| max | 0.0058ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p50 | 0.00042ms | 0.00038ms | +0.000042ms | +11.20% |
| p95 | 0.0013ms | 0.00055ms | +0.00071ms | +129.25% |
| p99 | 0.0041ms | 0.0039ms | +0.00017ms | +4.49% |
| mean | 0.00055ms | 0.00047ms | +0.000079ms | +16.73% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0058ms | 0.0058ms | 0.00ms | 0.00% |
| total | 0.11ms | 0.09ms | +0.02ms | +16.73% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00067ms |
| p99 | 0.0034ms |
| mean | 0.00046ms |
| stdev | 0.00060ms |
| min | 0.00029ms |
| max | 0.0063ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00067ms | 0.00050ms | +0.00017ms | +34.23% |
| p99 | 0.0034ms | 0.0016ms | +0.0018ms | +114.29% |
| mean | 0.00046ms | 0.00041ms | +0.000050ms | +12.33% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.0063ms | 0.0032ms | +0.0032ms | +100.03% |
| total | 0.09ms | 0.08ms | +0.01ms | +12.33% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00059ms |
| p99 | 0.0056ms |
| mean | 0.00047ms |
| stdev | 0.00091ms |
| min | 0.00025ms |
| max | 0.0093ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | +0.0000010ms | +0.34% |
| p50 | 0.00033ms | 0.00029ms | +0.000041ms | +14.04% |
| p95 | 0.00059ms | 0.00038ms | +0.00022ms | +57.39% |
| p99 | 0.0056ms | 0.0022ms | +0.0034ms | +157.39% |
| mean | 0.00047ms | 0.00041ms | +0.000068ms | +16.63% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0093ms | 0.0086ms | +0.00071ms | +8.24% |
| total | 0.09ms | 0.08ms | +0.01ms | +16.63% |

