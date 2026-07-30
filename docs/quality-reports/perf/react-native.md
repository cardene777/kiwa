# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createRNTestEnv | 0.00046ms | 0.0027ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00038ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| navigate | 0.00029ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00042ms | 0.0040ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 -9% (閾値未満)、 p95 +84% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| setPlatform | 0.00033ms | 0.0025ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| createRNTestEnv | cpu | 0.08ms | 0.10ms | 0.00046ms | 0.005 | 0.005 | 0.00044ms | 0.00042ms |
| asyncStorageSetGet | cpu | 0.08ms | 0.09ms | 0.00038ms | 0.005 | 0.005 | 0.00037ms | 0.00038ms |
| navigate | cpu | 0.08ms | 0.10ms | 0.00029ms | 0.004 | 0.004 | 0.00029ms | 0.00033ms |
| dispatchLinkingUrl | cpu | 0.08ms | 0.10ms | 0.00042ms | 0.005 | 0.006 | 0.00041ms | 0.00046ms |
| setPlatform | cpu | 0.08ms | 0.10ms | 0.00033ms | 0.004 | 0.004 | 0.00033ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createRNTestEnv | 0.03ms | 10ms | PASS |
| asyncStorageSetGet | 0.01ms | 10ms | PASS |
| navigate | 0.01ms | 10ms | PASS |
| dispatchLinkingUrl | 0.02ms | 10ms | PASS |
| setPlatform | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createRNTestEnv | -9488 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -14856 B | 0 B | 102400 B | yes | PASS |
| navigate | 4624 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 744 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00054ms |
| p95 | 0.0027ms |
| p99 | 0.01ms |
| mean | 0.00099ms |
| stdev | 0.0019ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.963)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00044ms | 0.00042ms | +0.000024ms | +5.81% |
| p50 | 0.00052ms | 0.00054ms | -0.000020ms | -3.66% |
| p95 | 0.0026ms | 0.0065ms | -0.0039ms | -59.60% |
| p99 | 0.01ms | 0.01ms | -0.0035ms | -24.43% |
| mean | 0.00095ms | 0.0017ms | -0.00073ms | -43.36% |
| min | 0.00040ms | 0.00038ms | +0.000026ms | +6.87% |
| max | 0.02ms | 0.02ms | -0.0057ms | -24.12% |
| total | 0.19ms | 0.34ms | -0.15ms | -43.36% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0013ms |
| p99 | 0.0083ms |
| mean | 0.00068ms |
| stdev | 0.0013ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.000)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00037ms | 0.00038ms | -1.7e-7ms | -0.05% |
| p50 | 0.00042ms | 0.00042ms | -1.9e-7ms | -0.05% |
| p95 | 0.0013ms | 0.0043ms | -0.0030ms | -69.32% |
| p99 | 0.0083ms | 0.0079ms | +0.00037ms | +4.71% |
| mean | 0.00068ms | 0.00086ms | -0.00018ms | -20.55% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.24% |
| max | 0.01ms | 0.01ms | -0.00080ms | -6.78% |
| total | 0.14ms | 0.17ms | -0.04ms | -20.55% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0014ms |
| p99 | 0.0053ms |
| mean | 0.00069ms |
| stdev | 0.0021ms |
| min | 0.00029ms |
| max | 0.03ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.993)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000044ms | -13.15% |
| p50 | 0.00033ms | 0.00038ms | -0.000043ms | -11.52% |
| p95 | 0.0014ms | 0.0022ms | -0.00074ms | -34.52% |
| p99 | 0.0053ms | 0.01ms | -0.0070ms | -57.01% |
| mean | 0.00069ms | 0.00082ms | -0.00013ms | -16.31% |
| min | 0.00029ms | 0.00033ms | -0.000044ms | -13.18% |
| max | 0.03ms | 0.02ms | +0.0035ms | +15.40% |
| total | 0.14ms | 0.16ms | -0.03ms | -16.31% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.0040ms |
| p99 | 0.0097ms |
| mean | 0.0011ms |
| stdev | 0.0027ms |
| min | 0.00038ms |
| max | 0.03ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.996)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00041ms | 0.00046ms | -0.000043ms | -9.49% |
| p50 | 0.00050ms | 0.00050ms | -0.0000018ms | -0.35% |
| p95 | 0.0040ms | 0.0022ms | +0.0018ms | +84.26% |
| p99 | 0.0097ms | 0.01ms | -0.0042ms | -30.35% |
| mean | 0.0011ms | 0.00098ms | +0.000087ms | +8.88% |
| min | 0.00037ms | 0.00046ms | -0.000084ms | -18.41% |
| max | 0.03ms | 0.02ms | +0.0088ms | +37.06% |
| total | 0.21ms | 0.20ms | +0.02ms | +8.88% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00046ms |
| p95 | 0.0025ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0081ms |
| min | 0.00029ms |
| max | 0.11ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000047ms | -1.42% |
| p50 | 0.00045ms | 0.00042ms | +0.000037ms | +8.81% |
| p95 | 0.0024ms | 0.0027ms | -0.00023ms | -8.46% |
| p99 | 0.01ms | 0.01ms | +0.000054ms | +0.50% |
| mean | 0.0014ms | 0.00085ms | +0.00055ms | +64.36% |
| min | 0.00029ms | 0.00029ms | -0.0000033ms | -1.15% |
| max | 0.11ms | 0.02ms | +0.09ms | +481.25% |
| total | 0.28ms | 0.17ms | +0.11ms | +64.36% |

