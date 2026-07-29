# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0026ms | 0.02ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.01ms | 0.02ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 26.43ms | 29.61ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.09ms | 40ms | PASS |
| callEachToolDirectly | 0.41ms | 60ms | PASS |
| runClaudeMcpChain | 27.99ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handshakeAndDiscover | -58288 B | 0 B | 102400 B | yes | PASS |
| callEachToolDirectly | -14616 B | 0 B | 102400 B | yes | PASS |
| runClaudeMcpChain | -1424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0050ms |
| stdev | 0.0052ms |
| min | 0.0025ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0027ms | -0.000042ms | -1.57% |
| p50 | 0.0027ms | 0.0037ms | -0.0010ms | -26.67% |
| p95 | 0.02ms | 0.02ms | +0.0028ms | +18.97% |
| p99 | 0.02ms | 0.02ms | +0.000062ms | +0.27% |
| mean | 0.0050ms | 0.0052ms | -0.00028ms | -5.33% |
| min | 0.0025ms | 0.0026ms | -0.000042ms | -1.63% |
| max | 0.03ms | 0.03ms | -0.00021ms | -0.72% |
| total | 0.30ms | 0.31ms | -0.02ms | -5.33% |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0037ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000088ms | +0.64% |
| p50 | 0.01ms | 0.01ms | +0.00010ms | +0.74% |
| p95 | 0.02ms | 0.02ms | +0.00017ms | +0.74% |
| p99 | 0.03ms | 0.03ms | +0.0016ms | +5.86% |
| mean | 0.02ms | 0.02ms | +0.000031ms | +0.19% |
| min | 0.01ms | 0.01ms | +0.00013ms | +0.91% |
| max | 0.03ms | 0.03ms | +0.0018ms | +5.74% |
| total | 0.95ms | 0.95ms | +0.0018ms | +0.19% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 26.43ms |
| p50 | 27.36ms |
| p95 | 29.61ms |
| p99 | 42.34ms |
| mean | 27.83ms |
| stdev | 3.01ms |
| min | 25.44ms |
| max | 45.28ms |
| total | 1669.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.43ms | 26.41ms | +0.02ms | +0.08% |
| p50 | 27.36ms | 27.45ms | -0.09ms | -0.32% |
| p95 | 29.61ms | 29.95ms | -0.34ms | -1.12% |
| p99 | 42.34ms | 35.47ms | +6.87ms | +19.38% |
| mean | 27.83ms | 27.70ms | +0.12ms | +0.45% |
| min | 25.44ms | 25.06ms | +0.38ms | +1.50% |
| max | 45.28ms | 38.18ms | +7.10ms | +18.60% |
| total | 1669.61ms | 1662.20ms | +7.41ms | +0.45% |

