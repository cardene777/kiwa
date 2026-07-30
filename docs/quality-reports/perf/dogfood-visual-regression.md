# Perf Suite — dogfood-visual-regression

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| seedAllBaselines | 0.10ms | 0.18ms | 50ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAllScenesNeutral | 0.21ms | 0.83ms | 80ms | 0.00029ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +149% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureAllScenesChanged | 0.19ms | 0.42ms | 80ms | 0.00030ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +86% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| acceptAllPendingChanges | 0.21ms | 1.72ms | 80ms | 0.00031ms | PASS | stable (換算後 p10 -6% (閾値未満)、 p95 +211% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| seedAllBaselines | cpu | 0.09ms | 0.10ms | 0.10ms | 1.112 | 0.992 | 0.09ms | 0.08ms |
| captureAllScenesNeutral | cpu | 0.09ms | 0.11ms | 0.21ms | 2.245 | 2.145 | 0.18ms | 0.17ms |
| captureAllScenesChanged | cpu | 0.09ms | 0.23ms | 0.19ms | 2.157 | 2.124 | 0.17ms | 0.17ms |
| acceptAllPendingChanges | cpu | 0.09ms | 0.78ms | 0.21ms | 2.300 | 2.438 | 0.19ms | 0.20ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| seedAllBaselines | 11.92ms | 100ms | PASS |
| captureAllScenesNeutral | 11.07ms | 160ms | PASS |
| captureAllScenesChanged | 9.51ms | 160ms | PASS |
| acceptAllPendingChanges | 12.48ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| seedAllBaselines | -23616 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesNeutral | -4128 B | 0 B | 102400 B | yes | PASS |
| captureAllScenesChanged | -78600 B | 0 B | 102400 B | yes | PASS |
| acceptAllPendingChanges | -4408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### seedAllBaselines

# Perf Report — seedAllBaselines.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.10ms |
| p50 | 0.12ms |
| p95 | 0.18ms |
| p99 | 1.55ms |
| mean | 0.18ms |
| stdev | 0.36ms |
| min | 0.09ms |
| max | 2.41ms |
| total | 7.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.887)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.08ms | +0.0096ms | +12.17% |
| p50 | 0.11ms | 0.11ms | -0.0085ms | -7.44% |
| p95 | 0.16ms | 0.21ms | -0.05ms | -24.80% |
| p99 | 1.38ms | 0.36ms | +1.01ms | +278.93% |
| mean | 0.16ms | 0.13ms | +0.03ms | +27.83% |
| min | 0.08ms | 0.08ms | +0.0011ms | +1.39% |
| max | 2.14ms | 0.45ms | +1.69ms | +376.64% |
| total | 6.42ms | 5.02ms | +1.40ms | +27.83% |

### captureAllScenesNeutral

# Perf Report — captureAllScenesNeutral.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.21ms |
| p50 | 0.23ms |
| p95 | 0.83ms |
| p99 | 2.34ms |
| mean | 0.37ms |
| stdev | 0.49ms |
| min | 0.21ms |
| max | 3.13ms |
| total | 14.91ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.18ms | 0.17ms | +0.0080ms | +4.66% |
| p50 | 0.19ms | 0.18ms | +0.01ms | +7.09% |
| p95 | 0.71ms | 0.29ms | +0.43ms | +149.04% |
| p99 | 2.01ms | 0.36ms | +1.65ms | +461.50% |
| mean | 0.32ms | 0.19ms | +0.13ms | +66.07% |
| min | 0.18ms | 0.17ms | +0.0062ms | +3.61% |
| max | 2.69ms | 0.37ms | +2.32ms | +630.08% |
| total | 12.80ms | 7.71ms | +5.09ms | +66.07% |

### captureAllScenesChanged

# Perf Report — captureAllScenesChanged.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.19ms |
| p50 | 0.20ms |
| p95 | 0.42ms |
| p99 | 0.58ms |
| mean | 0.23ms |
| stdev | 0.09ms |
| min | 0.19ms |
| max | 0.64ms |
| total | 9.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.17ms | 0.17ms | +0.0026ms | +1.53% |
| p50 | 0.19ms | 0.18ms | +0.0096ms | +5.49% |
| p95 | 0.38ms | 0.20ms | +0.17ms | +85.57% |
| p99 | 0.53ms | 0.39ms | +0.14ms | +36.53% |
| mean | 0.21ms | 0.19ms | +0.02ms | +12.86% |
| min | 0.17ms | 0.17ms | +0.0032ms | +1.89% |
| max | 0.58ms | 0.50ms | +0.08ms | +15.55% |
| total | 8.45ms | 7.49ms | +0.96ms | +12.86% |

### acceptAllPendingChanges

# Perf Report — acceptAllPendingChanges.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.21ms |
| p50 | 0.21ms |
| p95 | 1.72ms |
| p99 | 4.90ms |
| mean | 0.51ms |
| stdev | 1.10ms |
| min | 0.20ms |
| max | 6.91ms |
| total | 20.47ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.920)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.20ms | -0.01ms | -5.69% |
| p50 | 0.20ms | 0.24ms | -0.04ms | -17.12% |
| p95 | 1.58ms | 0.51ms | +1.07ms | +211.10% |
| p99 | 4.51ms | 0.64ms | +3.87ms | +603.27% |
| mean | 0.47ms | 0.27ms | +0.20ms | +73.67% |
| min | 0.19ms | 0.19ms | -0.0076ms | -3.92% |
| max | 6.36ms | 0.71ms | +5.65ms | +799.81% |
| total | 18.84ms | 10.85ms | +7.99ms | +73.67% |

