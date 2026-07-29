# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00033ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00025ms | 0.00058ms | 5ms | 0.00033ms | PASS | stable (差 0.000083ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00025ms | 0.00068ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -151784 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 4864 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00040ms |
| p95 | 0.00063ms |
| p99 | 0.0023ms |
| mean | 0.00047ms |
| stdev | 0.00043ms |
| min | 0.00033ms |
| max | 0.0047ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00040ms | 0.00038ms | +0.000021ms | +5.47% |
| p95 | 0.00063ms | 0.00055ms | +0.000079ms | +14.44% |
| p99 | 0.0023ms | 0.0039ms | -0.0016ms | -40.60% |
| mean | 0.00047ms | 0.00047ms | -0.0000067ms | -1.40% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0047ms | 0.0058ms | -0.0012ms | -20.00% |
| total | 0.09ms | 0.09ms | -0.0013ms | -1.40% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00058ms |
| p99 | 0.0032ms |
| mean | 0.00041ms |
| stdev | 0.00055ms |
| min | 0.00025ms |
| max | 0.0051ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| p50 | 0.00029ms | 0.00038ms | -0.000083ms | -22.13% |
| p95 | 0.00058ms | 0.00050ms | +0.000083ms | +16.60% |
| p99 | 0.0032ms | 0.0016ms | +0.0016ms | +98.67% |
| mean | 0.00041ms | 0.00041ms | +0.0000029ms | +0.71% |
| min | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| max | 0.0051ms | 0.0032ms | +0.0019ms | +60.58% |
| total | 0.08ms | 0.08ms | +0.00058ms | +0.71% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00068ms |
| p99 | 0.0051ms |
| mean | 0.00044ms |
| stdev | 0.00084ms |
| min | 0.00021ms |
| max | 0.0080ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00068ms | 0.00038ms | +0.00030ms | +80.20% |
| p99 | 0.0051ms | 0.0022ms | +0.0029ms | +136.26% |
| mean | 0.00044ms | 0.00041ms | +0.000037ms | +9.09% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0080ms | 0.0086ms | -0.00054ms | -6.33% |
| total | 0.09ms | 0.08ms | +0.0074ms | +9.09% |

