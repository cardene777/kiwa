# Perf Suite — dogfood-mcp-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | 0.0030ms | 0.04ms | 20ms | 0.00030ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +161% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| callEachToolDirectly | 0.02ms | 0.04ms | 30ms | 0.00029ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runClaudeMcpChain | 28.25ms | 31.59ms | 80ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| handshakeAndDiscover | cpu | 0.09ms | 0.28ms | 0.0030ms | 0.034 | 0.034 | n/a | 20.0% | 0.0027ms | 0.0027ms |
| callEachToolDirectly | cpu | 0.09ms | 0.10ms | 0.02ms | 0.170 | 0.164 | n/a | 20.0% | 0.01ms | 0.01ms |
| runClaudeMcpChain | cpu | 0.09ms | 0.14ms | 28.25ms | 311.006 | 319.715 | n/a | 20.0% | 25.90ms | 26.62ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handshakeAndDiscover | 0.55ms | 40ms | PASS |
| callEachToolDirectly | 0.42ms | 60ms | PASS |
| runClaudeMcpChain | 31.75ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| handshakeAndDiscover | -53272 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| callEachToolDirectly | -14120 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| runClaudeMcpChain | -1664 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### handshakeAndDiscover

# Perf Report — handshakeAndDiscover.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0044ms |
| p95 | 0.04ms |
| p99 | 0.65ms |
| mean | 0.03ms |
| stdev | 0.19ms |
| min | 0.0029ms |
| max | 1.47ms |
| total | 2.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.897)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | -0.000017ms | -0.61% |
| p50 | 0.0039ms | 0.0037ms | +0.00022ms | +5.84% |
| p95 | 0.04ms | 0.01ms | +0.02ms | +160.55% |
| p99 | 0.58ms | 0.03ms | +0.56ms | +1983.38% |
| mean | 0.03ms | 0.0052ms | +0.03ms | +503.02% |
| min | 0.0026ms | 0.0025ms | +0.000076ms | +2.99% |
| max | 1.32ms | 0.04ms | +1.28ms | +3510.09% |
| total | 1.87ms | 0.31ms | +1.56ms | +503.02% |

### callEachToolDirectly

# Perf Report — callEachToolDirectly.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.15ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.28ms |
| total | 1.44ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.879)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00043ms | +3.21% |
| p50 | 0.01ms | 0.01ms | +0.000056ms | +0.39% |
| p95 | 0.03ms | 0.03ms | +0.0068ms | +25.95% |
| p99 | 0.13ms | 0.04ms | +0.09ms | +220.25% |
| mean | 0.02ms | 0.02ms | +0.0046ms | +27.69% |
| min | 0.01ms | 0.01ms | -0.000027ms | -0.22% |
| max | 0.25ms | 0.04ms | +0.20ms | +469.47% |
| total | 1.26ms | 0.99ms | +0.27ms | +27.69% |

### runClaudeMcpChain

# Perf Report — runClaudeMcpChain.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 28.25ms |
| p50 | 29.62ms |
| p95 | 31.59ms |
| p99 | 35.42ms |
| mean | 29.77ms |
| stdev | 1.55ms |
| min | 26.91ms |
| max | 37.10ms |
| total | 1786.40ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.917)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 25.90ms | 26.62ms | -0.73ms | -2.72% |
| p50 | 27.16ms | 27.50ms | -0.35ms | -1.26% |
| p95 | 28.96ms | 27.76ms | +1.20ms | +4.32% |
| p99 | 32.47ms | 28.28ms | +4.19ms | +14.83% |
| mean | 27.30ms | 27.30ms | -0.0055ms | -0.02% |
| min | 24.67ms | 25.95ms | -1.28ms | -4.94% |
| max | 34.01ms | 28.59ms | +5.42ms | +18.97% |
| total | 1637.89ms | 1638.21ms | -0.33ms | -0.02% |

