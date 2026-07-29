# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0034ms | 0.02ms | 20ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.01ms | 0.03ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 27.92ms | 30.57ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.21ms | 40ms | PASS |
| callEachToolDirectly | 0.33ms | 60ms | PASS |
| runClaudeMcpChain | 30.85ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handshakeAndDiscover | -54048 B | 0 B | 102400 B | yes | PASS |
| callEachToolDirectly | -13528 B | 0 B | 102400 B | yes | PASS |
| runClaudeMcpChain | -1440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0034ms |
| p50 | 0.0049ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0067ms |
| stdev | 0.0053ms |
| min | 0.0030ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0027ms | +0.00074ms | +27.85% |
| p50 | 0.0049ms | 0.0037ms | +0.0012ms | +31.67% |
| p95 | 0.02ms | 0.02ms | +0.0025ms | +16.42% |
| p99 | 0.03ms | 0.02ms | +0.0031ms | +13.15% |
| mean | 0.0067ms | 0.0052ms | +0.0014ms | +27.18% |
| min | 0.0030ms | 0.0026ms | +0.00046ms | +17.77% |
| max | 0.03ms | 0.03ms | +0.0026ms | +9.09% |
| total | 0.40ms | 0.31ms | +0.09ms | +27.18% |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00038ms | +2.73% |
| p50 | 0.01ms | 0.01ms | +0.00048ms | +3.38% |
| p95 | 0.03ms | 0.02ms | +0.0032ms | +13.91% |
| p99 | 0.09ms | 0.03ms | +0.06ms | +219.90% |
| mean | 0.02ms | 0.02ms | +0.0030ms | +18.65% |
| min | 0.01ms | 0.01ms | +0.00038ms | +2.74% |
| max | 0.16ms | 0.03ms | +0.13ms | +423.89% |
| total | 1.13ms | 0.95ms | +0.18ms | +18.65% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 27.92ms |
| p50 | 29.31ms |
| p95 | 30.57ms |
| p99 | 30.59ms |
| mean | 29.26ms |
| stdev | 0.94ms |
| min | 26.98ms |
| max | 30.60ms |
| total | 1755.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 27.92ms | 26.41ms | +1.51ms | +5.70% |
| p50 | 29.31ms | 27.45ms | +1.86ms | +6.76% |
| p95 | 30.57ms | 29.95ms | +0.62ms | +2.06% |
| p99 | 30.59ms | 35.47ms | -4.88ms | -13.75% |
| mean | 29.26ms | 27.70ms | +1.56ms | +5.63% |
| min | 26.98ms | 25.06ms | +1.92ms | +7.66% |
| max | 30.60ms | 38.18ms | -7.58ms | -19.85% |
| total | 1755.83ms | 1662.20ms | +93.63ms | +5.63% |

