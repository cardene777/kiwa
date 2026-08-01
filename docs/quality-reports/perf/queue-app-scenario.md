# Perf Suite — queue-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 5.20ms | 6.49ms | 200ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |
| consumer_processing_with_return (5 addJob + assertProcessed) | 28.20ms | 31.14ms | 200ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_retry_cycle (fail 3 job + assertFailed) | 16.50ms | 18.90ms | 200ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | cpu | 0.09ms | 0.13ms | 5.20ms | 55.024 | 52.765 | n/a | 20.0% | 5.41ms | 5.19ms |
| consumer_processing_with_return (5 addJob + assertProcessed) | cpu | 0.09ms | 0.12ms | 28.20ms | 321.698 | 339.392 | n/a | 20.0% | 26.53ms | 27.99ms |
| error_retry_cycle (fail 3 job + assertFailed) | cpu | 0.09ms | 0.17ms | 16.50ms | 184.000 | 205.291 | n/a | 20.0% | 15.23ms | 16.99ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| producer_burst (20 addJob + process + drain) | 6.68ms | 400ms | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 30.40ms | 400ms | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | 17.08ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| producer_burst (20 addJob + process + drain) | -22120 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| consumer_processing_with_return (5 addJob + assertProcessed) | 5056 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| error_retry_cycle (fail 3 job + assertFailed) | -288 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### producer_burst (20 addJob + process + drain)

# Perf Report — producer_burst (20 addJob + process + drain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.20ms |
| p50 | 6.05ms |
| p95 | 6.49ms |
| p99 | 6.57ms |
| mean | 5.94ms |
| stdev | 0.56ms |
| min | 4.88ms |
| max | 6.60ms |
| total | 118.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.040)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.41ms | 5.19ms | +0.22ms | +4.28% |
| p50 | 6.29ms | 6.43ms | -0.14ms | -2.22% |
| p95 | 6.75ms | 6.49ms | +0.26ms | +4.01% |
| p99 | 6.84ms | 6.52ms | +0.31ms | +4.78% |
| mean | 6.18ms | 5.98ms | +0.19ms | +3.20% |
| min | 5.07ms | 4.57ms | +0.51ms | +11.07% |
| max | 6.86ms | 6.53ms | +0.32ms | +4.97% |
| total | 123.51ms | 119.68ms | +3.83ms | +3.20% |

### consumer_processing_with_return (5 addJob + assertProcessed)

# Perf Report — consumer_processing_with_return (5 addJob + assertProcessed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 28.20ms |
| p50 | 29.46ms |
| p95 | 31.14ms |
| p99 | 31.30ms |
| mean | 29.57ms |
| stdev | 1.14ms |
| min | 27.25ms |
| max | 31.34ms |
| total | 591.42ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.941)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.53ms | 27.99ms | -1.46ms | -5.21% |
| p50 | 27.72ms | 29.32ms | -1.60ms | -5.46% |
| p95 | 29.30ms | 30.59ms | -1.29ms | -4.21% |
| p99 | 29.45ms | 30.69ms | -1.24ms | -4.03% |
| mean | 27.82ms | 29.15ms | -1.33ms | -4.57% |
| min | 25.63ms | 26.86ms | -1.22ms | -4.55% |
| max | 29.49ms | 30.71ms | -1.23ms | -3.99% |
| total | 556.42ms | 583.06ms | -26.65ms | -4.57% |

### error_retry_cycle (fail 3 job + assertFailed)

# Perf Report — error_retry_cycle (fail 3 job + assertFailed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.50ms |
| p50 | 17.55ms |
| p95 | 18.90ms |
| p99 | 19.52ms |
| mean | 17.51ms |
| stdev | 1.07ms |
| min | 14.79ms |
| max | 19.68ms |
| total | 350.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.23ms | 16.99ms | -1.76ms | -10.37% |
| p50 | 16.19ms | 17.94ms | -1.75ms | -9.74% |
| p95 | 17.44ms | 18.77ms | -1.33ms | -7.06% |
| p99 | 18.02ms | 19.17ms | -1.15ms | -6.00% |
| mean | 16.16ms | 17.81ms | -1.66ms | -9.30% |
| min | 13.65ms | 15.06ms | -1.41ms | -9.39% |
| max | 18.16ms | 19.27ms | -1.11ms | -5.74% |
| total | 323.12ms | 356.27ms | -33.15ms | -9.30% |

