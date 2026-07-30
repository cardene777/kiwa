# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.04ms | 0.07ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.06ms | 0.07ms | 100ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.04ms | 0.05ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | cpu | 0.08ms | 0.09ms | 0.04ms | 0.438 | 0.423 | 0.04ms | 0.03ms |
| large_history_detect (200 test × 5 run) | cpu | 0.08ms | 0.09ms | 0.06ms | 0.670 | 0.687 | 0.05ms | 0.05ms |
| threshold_varying_workload (10 different threshold) | cpu | 0.08ms | 0.09ms | 0.04ms | 0.547 | 0.515 | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.18ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.43ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.32ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -6384 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | 6952 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 1.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0012ms | +3.50% |
| p50 | 0.04ms | 0.04ms | -0.0022ms | -5.78% |
| p95 | 0.07ms | 0.07ms | +0.00082ms | +1.23% |
| p99 | 0.07ms | 0.08ms | -0.0035ms | -4.56% |
| mean | 0.04ms | 0.04ms | +0.00067ms | +1.59% |
| min | 0.03ms | 0.03ms | +0.0016ms | +4.72% |
| max | 0.08ms | 0.08ms | -0.0033ms | -4.21% |
| total | 1.28ms | 1.26ms | +0.02ms | +1.59% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.0062ms |
| min | 0.06ms |
| max | 0.08ms |
| total | 1.80ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.964)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0014ms | -2.49% |
| p50 | 0.06ms | 0.06ms | -0.0084ms | -13.15% |
| p95 | 0.07ms | 0.12ms | -0.05ms | -42.90% |
| p99 | 0.08ms | 0.20ms | -0.13ms | -62.29% |
| mean | 0.06ms | 0.07ms | -0.02ms | -21.88% |
| min | 0.05ms | 0.05ms | -0.0010ms | -1.92% |
| max | 0.08ms | 0.23ms | -0.15ms | -66.47% |
| total | 1.74ms | 2.22ms | -0.49ms | -21.88% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0042ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 1.43ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.976)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0026ms | +6.30% |
| p50 | 0.04ms | 0.04ms | +0.0027ms | +6.40% |
| p95 | 0.05ms | 0.05ms | +0.0030ms | +5.85% |
| p99 | 0.06ms | 0.05ms | +0.0087ms | +16.98% |
| mean | 0.05ms | 0.04ms | +0.0028ms | +6.44% |
| min | 0.04ms | 0.04ms | +0.0029ms | +7.13% |
| max | 0.06ms | 0.05ms | +0.01ms | +21.01% |
| total | 1.40ms | 1.31ms | +0.08ms | +6.44% |

