# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0027ms | 0.02ms | 20ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.01ms | 0.04ms | 30ms | 0.00050ms | PASS | stable (p10 -3% (閾値未満)、 p95 +67% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 26.39ms | 36.16ms | 80ms | 0.00049ms | PASS | stable (p10 -2% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| handshakeAndDiscover | cpu | 0.09ms | 0.0027ms | 0.031 | 0.033 | 0.0026ms | 0.0027ms |
| callEachToolDirectly | cpu | 0.08ms | 0.01ms | 0.163 | 0.168 | 0.01ms | 0.01ms |
| runClaudeMcpChain | cpu | 0.08ms | 26.39ms | 318.160 | 323.084 | 25.97ms | 26.37ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.06ms | 40ms | PASS |
| callEachToolDirectly | 0.29ms | 60ms | PASS |
| runClaudeMcpChain | 32.07ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handshakeAndDiscover | -11920 B | 0 B | 102400 B | yes | PASS |
| callEachToolDirectly | -3064 B | 0 B | 102400 B | yes | PASS |
| runClaudeMcpChain | -1280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0032ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0050ms |
| stdev | 0.0062ms |
| min | 0.0026ms |
| max | 0.04ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | +0.000037ms | +1.38% |
| p50 | 0.0032ms | 0.0029ms | +0.00029ms | +10.14% |
| p95 | 0.02ms | 0.02ms | -0.0056ms | -26.00% |
| p99 | 0.03ms | 0.03ms | +0.0042ms | +15.15% |
| mean | 0.0050ms | 0.0057ms | -0.00075ms | -13.02% |
| min | 0.0026ms | 0.0026ms | 0.00ms | 0.00% |
| max | 0.04ms | 0.03ms | +0.0039ms | +11.72% |
| total | 0.30ms | 0.34ms | -0.04ms | -13.02% |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 1.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00042ms | -3.04% |
| p50 | 0.02ms | 0.01ms | +0.00088ms | +5.88% |
| p95 | 0.04ms | 0.03ms | +0.02ms | +66.73% |
| p99 | 0.08ms | 0.08ms | +0.0021ms | +2.71% |
| mean | 0.02ms | 0.02ms | +0.0015ms | +8.39% |
| min | 0.01ms | 0.01ms | -0.0015ms | -10.64% |
| max | 0.12ms | 0.14ms | -0.01ms | -10.52% |
| total | 1.19ms | 1.10ms | +0.09ms | +8.39% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 26.39ms |
| p50 | 27.98ms |
| p95 | 36.16ms |
| p99 | 43.27ms |
| mean | 29.21ms |
| stdev | 3.91ms |
| min | 24.91ms |
| max | 48.64ms |
| total | 1752.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.39ms | 26.37ms | +0.02ms | +0.08% |
| p50 | 27.98ms | 27.26ms | +0.72ms | +2.65% |
| p95 | 36.16ms | 27.61ms | +8.54ms | +30.94% |
| p99 | 43.27ms | 28.17ms | +15.10ms | +53.61% |
| mean | 29.21ms | 27.07ms | +2.14ms | +7.91% |
| min | 24.91ms | 24.60ms | +0.32ms | +1.28% |
| max | 48.64ms | 28.31ms | +20.34ms | +71.84% |
| total | 1752.80ms | 1624.33ms | +128.47ms | +7.91% |

