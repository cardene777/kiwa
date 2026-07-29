# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0027ms | 0.02ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.01ms | 0.03ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 26.37ms | 27.55ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.08ms | 40ms | PASS |
| callEachToolDirectly | 0.16ms | 60ms | PASS |
| runClaudeMcpChain | 29.34ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handshakeAndDiscover | -56448 B | 0 B | 102400 B | yes | PASS |
| callEachToolDirectly | -13704 B | 0 B | 102400 B | yes | PASS |
| runClaudeMcpChain | -2272 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0037ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0053ms |
| stdev | 0.0047ms |
| min | 0.0025ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | +0.000042ms | +1.58% |
| p50 | 0.0037ms | 0.0037ms | -0.000021ms | -0.56% |
| p95 | 0.02ms | 0.02ms | +0.0012ms | +7.74% |
| p99 | 0.02ms | 0.02ms | -0.00036ms | -1.54% |
| mean | 0.0053ms | 0.0052ms | +0.000026ms | +0.49% |
| min | 0.0025ms | 0.0026ms | -0.000041ms | -1.59% |
| max | 0.03ms | 0.03ms | -0.00046ms | -1.59% |
| total | 0.32ms | 0.31ms | +0.0015ms | +0.49% |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0041ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00017ms | +1.25% |
| p50 | 0.01ms | 0.01ms | +0.00023ms | +1.62% |
| p95 | 0.03ms | 0.02ms | +0.0024ms | +10.41% |
| p99 | 0.03ms | 0.03ms | +0.0040ms | +14.56% |
| mean | 0.02ms | 0.02ms | +0.00034ms | +2.13% |
| min | 0.01ms | 0.01ms | +0.00013ms | +0.91% |
| max | 0.03ms | 0.03ms | +0.00037ms | +1.20% |
| total | 0.97ms | 0.95ms | +0.02ms | +2.13% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 26.37ms |
| p50 | 27.16ms |
| p95 | 27.55ms |
| p99 | 27.60ms |
| mean | 27.05ms |
| stdev | 0.46ms |
| min | 25.73ms |
| max | 27.61ms |
| total | 1623.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.37ms | 26.41ms | -0.04ms | -0.16% |
| p50 | 27.16ms | 27.45ms | -0.29ms | -1.05% |
| p95 | 27.55ms | 29.95ms | -2.40ms | -8.00% |
| p99 | 27.60ms | 35.47ms | -7.87ms | -22.18% |
| mean | 27.05ms | 27.70ms | -0.65ms | -2.34% |
| min | 25.73ms | 25.06ms | +0.67ms | +2.68% |
| max | 27.61ms | 38.18ms | -10.56ms | -27.67% |
| total | 1623.24ms | 1662.20ms | -38.95ms | -2.34% |

