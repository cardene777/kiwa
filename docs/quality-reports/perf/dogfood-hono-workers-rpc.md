# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.02ms | 0.05ms | 80ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKv | 0.02ms | 0.03ms | 80ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveD1 | 0.01ms | 0.02ms | 80ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveR2 | 0.01ms | 0.03ms | 100ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveExecutionCtx | 0.0086ms | 0.01ms | 50ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| driveRoute | cpu | 0.09ms | 0.10ms | 0.02ms | 0.219 | 0.241 | n/a | 20.0% | 0.02ms | 0.02ms |
| driveKv | cpu | 0.09ms | 0.09ms | 0.02ms | 0.211 | 0.214 | n/a | 20.0% | 0.02ms | 0.02ms |
| driveD1 | cpu | 0.09ms | 0.09ms | 0.01ms | 0.154 | 0.157 | n/a | 20.0% | 0.01ms | 0.01ms |
| driveR2 | cpu | 0.09ms | 0.09ms | 0.01ms | 0.163 | 0.168 | n/a | 20.0% | 0.01ms | 0.01ms |
| driveExecutionCtx | cpu | 0.09ms | 0.09ms | 0.0086ms | 0.095 | 0.097 | n/a | 20.0% | 0.0079ms | 0.0080ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 1.26ms | 160ms | PASS |
| driveKv | 0.31ms | 160ms | PASS |
| driveD1 | 0.28ms | 160ms | PASS |
| driveR2 | 0.16ms | 200ms | PASS |
| driveExecutionCtx | 0.11ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| driveRoute | -6392 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveKv | -51144 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveD1 | 10864 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveR2 | 7256 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveExecutionCtx | -6928 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.13ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.62ms |
| total | 6.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.915)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0018ms | -8.92% |
| p50 | 0.02ms | 0.02ms | -0.00065ms | -2.86% |
| p95 | 0.05ms | 0.05ms | -0.0057ms | -10.73% |
| p99 | 0.12ms | 0.10ms | +0.02ms | +24.96% |
| mean | 0.03ms | 0.03ms | -0.0023ms | -7.32% |
| min | 0.02ms | 0.02ms | -0.00083ms | -4.92% |
| max | 0.56ms | 0.91ms | -0.34ms | -37.81% |
| total | 5.73ms | 6.19ms | -0.45ms | -7.32% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 4.51ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00018ms | -1.01% |
| p50 | 0.02ms | 0.02ms | -0.0011ms | -5.69% |
| p95 | 0.03ms | 0.03ms | -0.0013ms | -4.07% |
| p99 | 0.07ms | 0.06ms | +0.0078ms | +12.75% |
| mean | 0.02ms | 0.02ms | -0.0012ms | -5.64% |
| min | 0.02ms | 0.02ms | -0.000025ms | -0.14% |
| max | 0.12ms | 0.12ms | +0.0018ms | +1.47% |
| total | 4.16ms | 4.41ms | -0.25ms | -5.64% |

### driveD1

# Perf Report — driveD1.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0076ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 3.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.918)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00021ms | -1.61% |
| p50 | 0.01ms | 0.01ms | -0.00043ms | -3.15% |
| p95 | 0.02ms | 0.02ms | +0.0021ms | +10.76% |
| p99 | 0.04ms | 0.04ms | +0.0043ms | +10.67% |
| mean | 0.01ms | 0.01ms | -0.000019ms | -0.13% |
| min | 0.01ms | 0.01ms | -0.000058ms | -0.47% |
| max | 0.09ms | 0.07ms | +0.02ms | +27.88% |
| total | 2.95ms | 2.95ms | -0.0038ms | -0.13% |

### driveR2

# Perf Report — driveR2.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.18ms |
| total | 3.60ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.929)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00041ms | -2.96% |
| p50 | 0.01ms | 0.01ms | +0.000026ms | +0.18% |
| p95 | 0.02ms | 0.02ms | +0.0032ms | +14.70% |
| p99 | 0.05ms | 0.05ms | -0.0010ms | -2.10% |
| mean | 0.02ms | 0.02ms | -0.00042ms | -2.46% |
| min | 0.01ms | 0.01ms | -0.00062ms | -4.57% |
| max | 0.17ms | 0.32ms | -0.15ms | -46.79% |
| total | 3.34ms | 3.43ms | -0.08ms | -2.46% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0086ms |
| p50 | 0.0088ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0092ms |
| stdev | 0.0014ms |
| min | 0.0084ms |
| max | 0.02ms |
| total | 1.84ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0080ms | -0.00011ms | -1.43% |
| p50 | 0.0082ms | 0.0084ms | -0.00022ms | -2.59% |
| p95 | 0.01ms | 0.01ms | -0.0029ms | -22.19% |
| p99 | 0.01ms | 0.02ms | -0.0036ms | -21.14% |
| mean | 0.0085ms | 0.0089ms | -0.00038ms | -4.27% |
| min | 0.0078ms | 0.0077ms | +0.000066ms | +0.85% |
| max | 0.02ms | 0.03ms | -0.0069ms | -25.79% |
| total | 1.70ms | 1.78ms | -0.08ms | -4.27% |

