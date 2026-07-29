# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0025ms | 0.01ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.01ms | 0.03ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 26.36ms | 28.14ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.08ms | 40ms | PASS |
| callEachToolDirectly | 0.18ms | 60ms | PASS |
| runClaudeMcpChain | 29.57ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handshakeAndDiscover | -10696 B | 0 B | 102400 B | yes | PASS |
| callEachToolDirectly | -14232 B | 0 B | 102400 B | yes | PASS |
| runClaudeMcpChain | -2144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0026ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0047ms |
| stdev | 0.0047ms |
| min | 0.0025ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0027ms | -0.00012ms | -4.54% |
| p50 | 0.0026ms | 0.0037ms | -0.0011ms | -29.44% |
| p95 | 0.01ms | 0.02ms | -0.0013ms | -8.41% |
| p99 | 0.02ms | 0.02ms | -0.0010ms | -4.28% |
| mean | 0.0047ms | 0.0052ms | -0.00053ms | -10.17% |
| min | 0.0025ms | 0.0026ms | -0.000083ms | -3.21% |
| max | 0.03ms | 0.03ms | -0.00088ms | -3.03% |
| total | 0.28ms | 0.31ms | -0.03ms | -10.17% |

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
| stdev | 0.0044ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00025ms | +1.81% |
| p50 | 0.01ms | 0.01ms | +0.00027ms | +1.91% |
| p95 | 0.03ms | 0.02ms | +0.0021ms | +8.87% |
| p99 | 0.03ms | 0.03ms | +0.0037ms | +13.43% |
| mean | 0.02ms | 0.02ms | +0.00065ms | +4.08% |
| min | 0.01ms | 0.01ms | +0.00017ms | +1.22% |
| max | 0.04ms | 0.03ms | +0.0055ms | +17.62% |
| total | 0.99ms | 0.95ms | +0.04ms | +4.08% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 26.36ms |
| p50 | 27.52ms |
| p95 | 28.14ms |
| p99 | 28.69ms |
| mean | 27.30ms |
| stdev | 0.60ms |
| min | 26.07ms |
| max | 28.97ms |
| total | 1638.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.36ms | 26.41ms | -0.05ms | -0.20% |
| p50 | 27.52ms | 27.45ms | +0.07ms | +0.25% |
| p95 | 28.14ms | 29.95ms | -1.81ms | -6.04% |
| p99 | 28.69ms | 35.47ms | -6.77ms | -19.10% |
| mean | 27.30ms | 27.70ms | -0.40ms | -1.44% |
| min | 26.07ms | 25.06ms | +1.01ms | +4.02% |
| max | 28.97ms | 38.18ms | -9.21ms | -24.11% |
| total | 1638.26ms | 1662.20ms | -23.93ms | -1.44% |

