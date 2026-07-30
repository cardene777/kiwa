# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| subscribeRoom | 3.35ms | 3.75ms | 50ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| deliverNotification | 3.47ms | 5.99ms | 30ms | 0.00032ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +60% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| getPending | 0.00033ms | 0.0030ms | 30ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| simulateReconnect | 0.00038ms | 0.0052ms | 100ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| subscribeRoom | cpu | 0.09ms | 0.16ms | 3.35ms | 38.543 | 40.679 | 3.17ms | 3.34ms |
| deliverNotification | cpu | 0.09ms | 0.18ms | 3.47ms | 39.874 | 40.614 | 3.27ms | 3.33ms |
| getPending | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | 0.00031ms | 0.00033ms |
| simulateReconnect | cpu | 0.09ms | 0.09ms | 0.00038ms | 0.004 | 0.004 | 0.00034ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.88ms | 100ms | PASS |
| deliverNotification | 5.58ms | 60ms | PASS |
| getPending | 0.01ms | 60ms | PASS |
| simulateReconnect | 0.01ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| subscribeRoom | 83872 B | 0 B | 102400 B | yes | PASS |
| deliverNotification | 39496 B | 0 B | 102400 B | yes | PASS |
| getPending | 32960 B | 0 B | 102400 B | yes | PASS |
| simulateReconnect | 45960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.35ms |
| p50 | 3.50ms |
| p95 | 3.75ms |
| p99 | 4.48ms |
| mean | 3.50ms |
| stdev | 0.33ms |
| min | 2.39ms |
| max | 4.90ms |
| total | 140.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.945)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.17ms | 3.34ms | -0.18ms | -5.25% |
| p50 | 3.31ms | 3.46ms | -0.15ms | -4.42% |
| p95 | 3.54ms | 3.58ms | -0.04ms | -1.19% |
| p99 | 4.24ms | 3.69ms | +0.55ms | +14.92% |
| mean | 3.31ms | 3.46ms | -0.15ms | -4.23% |
| min | 2.26ms | 3.18ms | -0.91ms | -28.77% |
| max | 4.63ms | 3.74ms | +0.89ms | +23.78% |
| total | 132.42ms | 138.28ms | -5.86ms | -4.23% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.47ms |
| p50 | 3.93ms |
| p95 | 5.99ms |
| p99 | 6.31ms |
| mean | 4.15ms |
| stdev | 0.80ms |
| min | 2.98ms |
| max | 6.38ms |
| total | 166.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.944)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.27ms | 3.33ms | -0.06ms | -1.82% |
| p50 | 3.71ms | 3.46ms | +0.25ms | +7.22% |
| p95 | 5.66ms | 3.53ms | +2.13ms | +60.18% |
| p99 | 5.96ms | 3.59ms | +2.37ms | +65.88% |
| mean | 3.92ms | 3.39ms | +0.53ms | +15.51% |
| min | 2.81ms | 2.30ms | +0.51ms | +22.29% |
| max | 6.02ms | 3.62ms | +2.40ms | +66.38% |
| total | 156.80ms | 135.75ms | +21.05ms | +15.51% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0030ms |
| p99 | 0.0058ms |
| mean | 0.00086ms |
| stdev | 0.0013ms |
| min | 0.00033ms |
| max | 0.0074ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.929)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00031ms | 0.00033ms | -0.000024ms | -7.08% |
| p50 | 0.00035ms | 0.00038ms | -0.000027ms | -7.08% |
| p95 | 0.0028ms | 0.0028ms | -0.0000089ms | -0.32% |
| p99 | 0.0054ms | 0.0061ms | -0.00067ms | -11.13% |
| mean | 0.00079ms | 0.00091ms | -0.00012ms | -13.02% |
| min | 0.00031ms | 0.00029ms | +0.000017ms | +5.96% |
| max | 0.0069ms | 0.0069ms | -0.000025ms | -0.37% |
| total | 0.03ms | 0.04ms | -0.0048ms | -13.02% |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00046ms |
| p95 | 0.0052ms |
| p99 | 0.0079ms |
| mean | 0.0010ms |
| stdev | 0.0018ms |
| min | 0.00033ms |
| max | 0.0082ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.912)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00034ms | 0.00033ms | +0.0000091ms | +2.75% |
| p50 | 0.00042ms | 0.00038ms | +0.000043ms | +11.43% |
| p95 | 0.0047ms | 0.0048ms | -0.000042ms | -0.88% |
| p99 | 0.0072ms | 0.0078ms | -0.00058ms | -7.43% |
| mean | 0.00095ms | 0.0011ms | -0.00015ms | -13.71% |
| min | 0.00030ms | 0.00029ms | +0.000013ms | +4.41% |
| max | 0.0075ms | 0.0082ms | -0.00072ms | -8.76% |
| total | 0.04ms | 0.04ms | -0.0060ms | -13.71% |

