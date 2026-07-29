# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0038ms | 0.02ms | 20ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.02ms | 0.03ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 26.71ms | 29.92ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.20ms | 40ms | PASS |
| callEachToolDirectly | 0.20ms | 60ms | PASS |
| runClaudeMcpChain | 29.61ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handshakeAndDiscover | -49504 B | 0 B | 102400 B | yes | PASS |
| callEachToolDirectly | -14536 B | 0 B | 102400 B | yes | PASS |
| runClaudeMcpChain | -1424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0038ms |
| p50 | 0.0040ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0057ms |
| stdev | 0.0045ms |
| min | 0.0037ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0027ms | +0.0012ms | +43.98% |
| p50 | 0.0040ms | 0.0037ms | +0.00023ms | +6.12% |
| p95 | 0.02ms | 0.02ms | +0.00034ms | +2.23% |
| p99 | 0.02ms | 0.02ms | +0.00027ms | +1.17% |
| mean | 0.0057ms | 0.0052ms | +0.00040ms | +7.71% |
| min | 0.0037ms | 0.0026ms | +0.0012ms | +45.18% |
| max | 0.03ms | 0.03ms | +0.00067ms | +2.31% |
| total | 0.34ms | 0.31ms | +0.02ms | +7.71% |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0044ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 1.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0013ms | +9.40% |
| p50 | 0.02ms | 0.01ms | +0.0033ms | +23.24% |
| p95 | 0.03ms | 0.02ms | +0.0046ms | +19.85% |
| p99 | 0.03ms | 0.03ms | +0.0057ms | +20.76% |
| mean | 0.02ms | 0.02ms | +0.0026ms | +16.10% |
| min | 0.02ms | 0.01ms | +0.0014ms | +10.05% |
| max | 0.04ms | 0.03ms | +0.0078ms | +24.96% |
| total | 1.10ms | 0.95ms | +0.15ms | +16.10% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 26.71ms |
| p50 | 27.69ms |
| p95 | 29.92ms |
| p99 | 30.55ms |
| mean | 27.85ms |
| stdev | 1.03ms |
| min | 26.05ms |
| max | 30.80ms |
| total | 1671.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.71ms | 26.41ms | +0.29ms | +1.11% |
| p50 | 27.69ms | 27.45ms | +0.24ms | +0.88% |
| p95 | 29.92ms | 29.95ms | -0.03ms | -0.12% |
| p99 | 30.55ms | 35.47ms | -4.92ms | -13.88% |
| mean | 27.85ms | 27.70ms | +0.15ms | +0.54% |
| min | 26.05ms | 25.06ms | +0.99ms | +3.94% |
| max | 30.80ms | 38.18ms | -7.37ms | -19.31% |
| total | 1671.11ms | 1662.20ms | +8.92ms | +0.54% |

