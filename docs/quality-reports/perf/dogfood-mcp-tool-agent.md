# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0032ms | 0.03ms | 20ms | 0.00033ms | PASS | stable (p10 +20% (閾値未満)、 p95 +133% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.02ms | 0.22ms | 30ms | 0.00033ms | PASS | stable (p10 +14% (閾値未満)、 p95 +844% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 26.99ms | 30.69ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.09ms | 40ms | PASS |
| callEachToolDirectly | 0.74ms | 60ms | PASS |
| runClaudeMcpChain | 28.21ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handshakeAndDiscover | -52416 B | 0 B | 102400 B | yes | PASS |
| callEachToolDirectly | -11272 B | 0 B | 102400 B | yes | PASS |
| runClaudeMcpChain | -2800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0032ms |
| p50 | 0.0057ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0030ms |
| max | 0.08ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0027ms | +0.00054ms | +20.32% |
| p50 | 0.0057ms | 0.0037ms | +0.0019ms | +51.67% |
| p95 | 0.03ms | 0.02ms | +0.02ms | +133.19% |
| p99 | 0.07ms | 0.02ms | +0.05ms | +207.65% |
| mean | 0.01ms | 0.0052ms | +0.0053ms | +100.93% |
| min | 0.0030ms | 0.0026ms | +0.00042ms | +16.14% |
| max | 0.08ms | 0.03ms | +0.05ms | +188.89% |
| total | 0.63ms | 0.31ms | +0.32ms | +100.93% |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.22ms |
| p99 | 4.24ms |
| mean | 0.21ms |
| stdev | 1.25ms |
| min | 0.02ms |
| max | 9.74ms |
| total | 12.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0019ms | +13.64% |
| p50 | 0.02ms | 0.01ms | +0.01ms | +74.12% |
| p95 | 0.22ms | 0.02ms | +0.20ms | +843.54% |
| p99 | 4.24ms | 0.03ms | +4.21ms | +15476.97% |
| mean | 0.21ms | 0.02ms | +0.19ms | +1219.23% |
| min | 0.02ms | 0.01ms | +0.0015ms | +10.97% |
| max | 9.74ms | 0.03ms | +9.71ms | +31118.69% |
| total | 12.55ms | 0.95ms | +11.60ms | +1219.23% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 26.99ms |
| p50 | 28.35ms |
| p95 | 30.69ms |
| p99 | 34.44ms |
| mean | 28.51ms |
| stdev | 1.67ms |
| min | 25.35ms |
| max | 34.98ms |
| total | 1710.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.99ms | 26.41ms | +0.58ms | +2.20% |
| p50 | 28.35ms | 27.45ms | +0.90ms | +3.28% |
| p95 | 30.69ms | 29.95ms | +0.74ms | +2.47% |
| p99 | 34.44ms | 35.47ms | -1.03ms | -2.90% |
| mean | 28.51ms | 27.70ms | +0.80ms | +2.90% |
| min | 25.35ms | 25.06ms | +0.29ms | +1.15% |
| max | 34.98ms | 38.18ms | -3.20ms | -8.37% |
| total | 1710.48ms | 1662.20ms | +48.28ms | +2.90% |

