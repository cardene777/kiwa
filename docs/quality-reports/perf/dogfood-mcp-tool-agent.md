# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0026ms | 0.02ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.01ms | 0.03ms | 30ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 26.54ms | 27.83ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.06ms | 40ms | PASS |
| callEachToolDirectly | 0.16ms | 60ms | PASS |
| runClaudeMcpChain | 27.91ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handshakeAndDiscover | -58640 B | 0 B | 102400 B | yes | PASS |
| callEachToolDirectly | -14424 B | 0 B | 102400 B | yes | PASS |
| runClaudeMcpChain | -1280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0029ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0047ms |
| stdev | 0.0050ms |
| min | 0.0025ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0027ms | -0.000080ms | -3.00% |
| p50 | 0.0029ms | 0.0037ms | -0.00087ms | -23.33% |
| p95 | 0.02ms | 0.02ms | +0.0023ms | +15.16% |
| p99 | 0.02ms | 0.02ms | +0.0011ms | +4.52% |
| mean | 0.0047ms | 0.0052ms | -0.00057ms | -10.89% |
| min | 0.0025ms | 0.0026ms | -0.000042ms | -1.63% |
| max | 0.03ms | 0.03ms | -0.0012ms | -4.18% |
| total | 0.28ms | 0.31ms | -0.03ms | -10.89% |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0076ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00037ms | -2.72% |
| p50 | 0.01ms | 0.01ms | +0.00038ms | +2.65% |
| p95 | 0.03ms | 0.02ms | +0.0067ms | +29.09% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +87.16% |
| mean | 0.02ms | 0.02ms | +0.0017ms | +10.63% |
| min | 0.01ms | 0.01ms | -0.00063ms | -4.57% |
| max | 0.05ms | 0.03ms | +0.02ms | +67.69% |
| total | 1.05ms | 0.95ms | +0.10ms | +10.63% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 26.54ms |
| p50 | 27.22ms |
| p95 | 27.83ms |
| p99 | 28.66ms |
| mean | 27.23ms |
| stdev | 0.51ms |
| min | 25.76ms |
| max | 28.70ms |
| total | 1633.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.54ms | 26.41ms | +0.13ms | +0.47% |
| p50 | 27.22ms | 27.45ms | -0.23ms | -0.83% |
| p95 | 27.83ms | 29.95ms | -2.12ms | -7.08% |
| p99 | 28.66ms | 35.47ms | -6.80ms | -19.19% |
| mean | 27.23ms | 27.70ms | -0.48ms | -1.72% |
| min | 25.76ms | 25.06ms | +0.70ms | +2.81% |
| max | 28.70ms | 38.18ms | -9.47ms | -24.81% |
| total | 1633.56ms | 1662.20ms | -28.64ms | -1.72% |

