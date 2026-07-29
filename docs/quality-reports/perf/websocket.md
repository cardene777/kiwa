# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00033ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00029ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00025ms | 0.00043ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +115%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -158928 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.00042ms |
| p95 | 0.00067ms |
| p99 | 0.0056ms |
| mean | 0.00081ms |
| stdev | 0.0041ms |
| min | 0.00029ms |
| max | 0.06ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| p95 | 0.00067ms | 0.00055ms | +0.00013ms | +22.89% |
| p99 | 0.0056ms | 0.0039ms | +0.0017ms | +44.24% |
| mean | 0.00081ms | 0.00047ms | +0.00034ms | +71.45% |
| min | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| max | 0.06ms | 0.0058ms | +0.05ms | +884.88% |
| total | 0.16ms | 0.09ms | +0.07ms | +71.45% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00063ms |
| p99 | 0.0037ms |
| mean | 0.00043ms |
| stdev | 0.00054ms |
| min | 0.00025ms |
| max | 0.0048ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00063ms | 0.00050ms | +0.00013ms | +26.25% |
| p99 | 0.0037ms | 0.0016ms | +0.0021ms | +129.69% |
| mean | 0.00043ms | 0.00041ms | +0.000024ms | +5.85% |
| min | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| max | 0.0048ms | 0.0032ms | +0.0017ms | +52.68% |
| total | 0.09ms | 0.08ms | +0.0048ms | +5.85% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00043ms |
| p99 | 0.0078ms |
| mean | 0.00047ms |
| stdev | 0.0011ms |
| min | 0.00025ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00043ms | 0.00038ms | +0.000050ms | +13.35% |
| p99 | 0.0078ms | 0.0022ms | +0.0056ms | +259.00% |
| mean | 0.00047ms | 0.00041ms | +0.000066ms | +16.33% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0086ms | +0.0033ms | +38.83% |
| total | 0.09ms | 0.08ms | +0.01ms | +16.33% |

