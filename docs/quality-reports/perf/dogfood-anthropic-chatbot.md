# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| reply | 8.72ms | 11.15ms | 30ms | 0.00080ms | PASS | stable — gate 無効 (regressionGate=false) |
| replyStream | 15.83ms | 21.44ms | 50ms | 0.00087ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| toolLoop | 17.75ms | 21.71ms | 100ms | 0.00082ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| reply | cpu | 0.09ms | 0.32ms | 8.72ms | 92.817 | 105.679 | n/a | 20.0% | 7.65ms | 8.71ms |
| replyStream | cpu | 0.09ms | 0.15ms | 15.83ms | 183.241 | 174.003 | n/a | 20.0% | 14.95ms | 14.19ms |
| toolLoop | cpu | 0.09ms | 0.18ms | 17.75ms | 190.096 | 207.771 | n/a | 20.0% | 15.79ms | 17.26ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 10.71ms | 60ms | PASS |
| replyStream | 21.45ms | 100ms | PASS |
| toolLoop | 21.64ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| reply | -5352 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| replyStream | -2696 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| toolLoop | -2360 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 8.72ms |
| p50 | 10.22ms |
| p95 | 11.15ms |
| p99 | 15.88ms |
| mean | 10.08ms |
| stdev | 1.52ms |
| min | 7.39ms |
| max | 17.80ms |
| total | 605.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.878)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 7.65ms | 8.71ms | -1.06ms | -12.17% |
| p50 | 8.96ms | 9.13ms | -0.16ms | -1.76% |
| p95 | 9.79ms | 9.18ms | +0.60ms | +6.58% |
| p99 | 13.93ms | 9.20ms | +4.73ms | +51.41% |
| mean | 8.85ms | 9.01ms | -0.17ms | -1.83% |
| min | 6.49ms | 7.37ms | -0.88ms | -11.94% |
| max | 15.62ms | 9.22ms | +6.40ms | +69.40% |
| total | 530.94ms | 540.87ms | -9.92ms | -1.83% |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 15.83ms |
| p50 | 16.88ms |
| p95 | 21.44ms |
| p99 | 22.54ms |
| mean | 17.32ms |
| stdev | 1.55ms |
| min | 15.58ms |
| max | 23.25ms |
| total | 1038.90ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.944)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.95ms | 14.19ms | +0.75ms | +5.31% |
| p50 | 15.94ms | 15.07ms | +0.87ms | +5.77% |
| p95 | 20.25ms | 15.67ms | +4.58ms | +29.23% |
| p99 | 21.29ms | 16.42ms | +4.87ms | +29.65% |
| mean | 16.35ms | 15.01ms | +1.34ms | +8.93% |
| min | 14.72ms | 13.69ms | +1.03ms | +7.54% |
| max | 21.96ms | 16.95ms | +5.00ms | +29.52% |
| total | 981.23ms | 900.82ms | +80.40ms | +8.93% |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p10 | 17.75ms |
| p50 | 19.59ms |
| p95 | 21.71ms |
| p99 | 24.70ms |
| mean | 19.64ms |
| stdev | 1.43ms |
| min | 16.65ms |
| max | 24.85ms |
| total | 1178.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.890)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.79ms | 17.26ms | -1.47ms | -8.51% |
| p50 | 17.43ms | 18.24ms | -0.81ms | -4.42% |
| p95 | 19.32ms | 19.93ms | -0.61ms | -3.04% |
| p99 | 21.99ms | 20.11ms | +1.88ms | +9.34% |
| mean | 17.48ms | 18.21ms | -0.73ms | -4.01% |
| min | 14.82ms | 15.73ms | -0.92ms | -5.82% |
| max | 22.12ms | 20.27ms | +1.85ms | +9.12% |
| total | 1048.73ms | 1092.50ms | -43.77ms | -4.01% |

