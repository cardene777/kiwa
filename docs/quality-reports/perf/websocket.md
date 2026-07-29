# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00038ms | 0.00054ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00029ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00025ms | 0.00039ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -2736 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 6160 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | -376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00054ms |
| p99 | 0.0028ms |
| mean | 0.00051ms |
| stdev | 0.00065ms |
| min | 0.00038ms |
| max | 0.0071ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p50 | 0.00042ms | 0.00038ms | +0.000042ms | +11.20% |
| p95 | 0.00054ms | 0.00055ms | -0.0000021ms | -0.38% |
| p99 | 0.0028ms | 0.0039ms | -0.0011ms | -28.22% |
| mean | 0.00051ms | 0.00047ms | +0.000036ms | +7.60% |
| min | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| max | 0.0071ms | 0.0058ms | +0.0013ms | +22.13% |
| total | 0.10ms | 0.09ms | +0.0072ms | +7.60% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00059ms |
| p99 | 0.0038ms |
| mean | 0.00044ms |
| stdev | 0.00058ms |
| min | 0.00025ms |
| max | 0.0047ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00059ms | 0.00050ms | +0.000087ms | +17.43% |
| p99 | 0.0038ms | 0.0016ms | +0.0022ms | +135.20% |
| mean | 0.00044ms | 0.00041ms | +0.000029ms | +6.99% |
| min | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| max | 0.0047ms | 0.0032ms | +0.0015ms | +48.74% |
| total | 0.09ms | 0.08ms | +0.0057ms | +6.99% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00039ms |
| p99 | 0.0072ms |
| mean | 0.00044ms |
| stdev | 0.0010ms |
| min | 0.00025ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00039ms | 0.00038ms | +0.000010ms | +2.77% |
| p99 | 0.0072ms | 0.0022ms | +0.0051ms | +233.95% |
| mean | 0.00044ms | 0.00041ms | +0.000034ms | +8.32% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0086ms | +0.0020ms | +22.81% |
| total | 0.09ms | 0.08ms | +0.0068ms | +8.32% |

