# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0031ms | 0.02ms | 20ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.02ms | 0.07ms | 30ms | 0.00031ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +136% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 26.93ms | 63.74ms | 80ms | 0.00031ms | PASS | stable (換算後 p10 -6% (閾値未満)、 p95 +113% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| handshakeAndDiscover | cpu | 0.09ms | 0.09ms | 0.0031ms | 0.034 | 0.034 | 0.0028ms | 0.0027ms |
| callEachToolDirectly | cpu | 0.09ms | 0.11ms | 0.02ms | 0.172 | 0.164 | 0.01ms | 0.01ms |
| runClaudeMcpChain | cpu | 0.09ms | 0.22ms | 26.93ms | 300.265 | 319.715 | 25.00ms | 26.62ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.09ms | 40ms | PASS |
| callEachToolDirectly | 0.27ms | 60ms | PASS |
| runClaudeMcpChain | 29.15ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handshakeAndDiscover | -29424 B | 0 B | 102400 B | yes | PASS |
| callEachToolDirectly | -13576 B | 0 B | 102400 B | yes | PASS |
| runClaudeMcpChain | -1408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0031ms |
| p50 | 0.0045ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0065ms |
| stdev | 0.0058ms |
| min | 0.0029ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0027ms | +0.000034ms | +1.23% |
| p50 | 0.0041ms | 0.0037ms | +0.00035ms | +9.54% |
| p95 | 0.02ms | 0.01ms | +0.0025ms | +17.60% |
| p99 | 0.03ms | 0.03ms | -0.0028ms | -9.89% |
| mean | 0.0059ms | 0.0052ms | +0.00070ms | +13.56% |
| min | 0.0026ms | 0.0025ms | +0.000092ms | +3.61% |
| max | 0.03ms | 0.04ms | -0.0064ms | -17.59% |
| total | 0.35ms | 0.31ms | +0.04ms | +13.56% |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.07ms |
| p99 | 0.23ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.01ms |
| max | 0.34ms |
| total | 1.78ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.918)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00064ms | +4.75% |
| p50 | 0.02ms | 0.01ms | +0.0023ms | +15.54% |
| p95 | 0.06ms | 0.03ms | +0.04ms | +135.73% |
| p99 | 0.22ms | 0.04ms | +0.18ms | +440.16% |
| mean | 0.03ms | 0.02ms | +0.01ms | +65.49% |
| min | 0.01ms | 0.01ms | +0.00019ms | +1.50% |
| max | 0.31ms | 0.04ms | +0.27ms | +622.48% |
| total | 1.64ms | 0.99ms | +0.65ms | +65.49% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 26.93ms |
| p50 | 28.55ms |
| p95 | 63.74ms |
| p99 | 99.82ms |
| mean | 34.09ms |
| stdev | 15.62ms |
| min | 25.01ms |
| max | 106.22ms |
| total | 2045.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.928)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 25.00ms | 26.62ms | -1.62ms | -6.08% |
| p50 | 26.51ms | 27.50ms | -0.99ms | -3.62% |
| p95 | 59.18ms | 27.76ms | +31.42ms | +113.18% |
| p99 | 92.68ms | 28.28ms | +64.40ms | +227.75% |
| mean | 31.65ms | 27.30ms | +4.35ms | +15.94% |
| min | 23.22ms | 25.95ms | -2.73ms | -10.53% |
| max | 98.63ms | 28.59ms | +70.04ms | +244.98% |
| total | 1899.28ms | 1638.21ms | +261.06ms | +15.94% |

