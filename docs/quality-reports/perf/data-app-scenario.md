# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.0041ms | 0.02ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.04ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0026ms | 0.02ms | 50ms | 0.00042ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +203% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | cpu | 0.08ms | 0.10ms | 0.0041ms | 0.049 | 0.049 | 0.0040ms | 0.0040ms |
| cron_scheduling (10 schedule + advanceMs 5 turn) | cpu | 0.08ms | 0.09ms | 0.03ms | 0.375 | 0.354 | 0.03ms | 0.03ms |
| integrated_workflow (queue + clock combined) | cpu | 0.08ms | 0.10ms | 0.0026ms | 0.032 | 0.031 | 0.0026ms | 0.0026ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.03ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.11ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.04ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -19640 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 8056 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | 264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0041ms |
| p50 | 0.0050ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0080ms |
| stdev | 0.0052ms |
| min | 0.0032ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.983)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0040ms | +0.000035ms | +0.86% |
| p50 | 0.0049ms | 0.0045ms | +0.00044ms | +9.69% |
| p95 | 0.02ms | 0.02ms | -0.0013ms | -6.77% |
| p99 | 0.02ms | 0.02ms | -0.0033ms | -14.59% |
| mean | 0.0079ms | 0.0076ms | +0.00023ms | +3.07% |
| min | 0.0032ms | 0.0029ms | +0.00028ms | +9.69% |
| max | 0.02ms | 0.02ms | -0.0039ms | -16.25% |
| total | 0.24ms | 0.23ms | +0.0070ms | +3.07% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0031ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.98ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.018)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0017ms | +5.78% |
| p50 | 0.03ms | 0.04ms | -0.0073ms | -18.68% |
| p95 | 0.04ms | 0.04ms | -0.0043ms | -9.70% |
| p99 | 0.04ms | 0.05ms | -0.0093ms | -17.77% |
| mean | 0.03ms | 0.04ms | -0.0039ms | -10.52% |
| min | 0.03ms | 0.03ms | +0.0020ms | +7.01% |
| max | 0.04ms | 0.05ms | -0.01ms | -20.15% |
| total | 0.99ms | 1.11ms | -0.12ms | -10.52% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0028ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.0087ms |
| stdev | 0.02ms |
| min | 0.0025ms |
| max | 0.12ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.007)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0026ms | +0.000063ms | +2.46% |
| p50 | 0.0028ms | 0.0027ms | +0.00014ms | +5.38% |
| p95 | 0.02ms | 0.0076ms | +0.02ms | +203.05% |
| p99 | 0.09ms | 0.01ms | +0.08ms | +585.28% |
| mean | 0.0087ms | 0.0036ms | +0.0051ms | +141.68% |
| min | 0.0026ms | 0.0025ms | +0.000059ms | +2.35% |
| max | 0.12ms | 0.02ms | +0.11ms | +647.92% |
| total | 0.26ms | 0.11ms | +0.15ms | +141.68% |

