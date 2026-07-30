# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.04ms | 0.14ms | 80ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveIsland | 0.0075ms | 0.19ms | 80ms | 0.00034ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +886% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveHead | 0.0033ms | 0.03ms | 50ms | 0.00034ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +422% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveEdgeEnv | 0.01ms | 0.23ms | 100ms | 0.00034ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +562% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| driveRoute | cpu | 0.10ms | 0.11ms | 0.04ms | 0.428 | 0.427 | 0.03ms | 0.03ms |
| driveIsland | cpu | 0.10ms | 0.36ms | 0.0075ms | 0.076 | 0.072 | 0.0062ms | 0.0059ms |
| driveHead | cpu | 0.10ms | 0.13ms | 0.0033ms | 0.033 | 0.033 | 0.0027ms | 0.0027ms |
| driveEdgeEnv | cpu | 0.10ms | 0.27ms | 0.01ms | 0.127 | 0.123 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 1.67ms | 160ms | PASS |
| driveIsland | 0.72ms | 160ms | PASS |
| driveHead | 0.14ms | 100ms | PASS |
| driveEdgeEnv | 0.41ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -114960 B | -12192 B | 102400 B | yes | PASS |
| driveIsland | -3432 B | 0 B | 102400 B | yes | PASS |
| driveHead | -19592 B | 0 B | 102400 B | yes | PASS |
| driveEdgeEnv | 8272 B | 120 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.14ms |
| p99 | 0.37ms |
| mean | 0.06ms |
| stdev | 0.06ms |
| min | 0.04ms |
| max | 0.61ms |
| total | 12.90ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.818)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00012ms | +0.36% |
| p50 | 0.04ms | 0.04ms | -0.0032ms | -7.27% |
| p95 | 0.12ms | 0.12ms | -0.0061ms | -4.90% |
| p99 | 0.30ms | 0.21ms | +0.09ms | +45.81% |
| mean | 0.05ms | 0.06ms | -0.0025ms | -4.55% |
| min | 0.03ms | 0.03ms | +0.0017ms | +5.61% |
| max | 0.50ms | 0.36ms | +0.14ms | +38.85% |
| total | 10.55ms | 11.05ms | -0.50ms | -4.55% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0075ms |
| p50 | 0.0097ms |
| p95 | 0.19ms |
| p99 | 1.58ms |
| mean | 0.08ms |
| stdev | 0.36ms |
| min | 0.0071ms |
| max | 4.06ms |
| total | 15.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.826)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0059ms | +0.00028ms | +4.81% |
| p50 | 0.0080ms | 0.0066ms | +0.0014ms | +21.11% |
| p95 | 0.16ms | 0.02ms | +0.14ms | +885.63% |
| p99 | 1.30ms | 0.04ms | +1.26ms | +3075.25% |
| mean | 0.06ms | 0.0083ms | +0.06ms | +686.16% |
| min | 0.0058ms | 0.0057ms | +0.00018ms | +3.20% |
| max | 3.35ms | 0.07ms | +3.29ms | +4883.85% |
| total | 12.97ms | 1.65ms | +11.32ms | +686.16% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0033ms |
| p50 | 0.0035ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.0075ms |
| stdev | 0.01ms |
| min | 0.0032ms |
| max | 0.07ms |
| total | 1.50ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.825)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | +0.0000080ms | +0.29% |
| p50 | 0.0029ms | 0.0028ms | +0.000020ms | +0.70% |
| p95 | 0.03ms | 0.0053ms | +0.02ms | +421.53% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +128.81% |
| mean | 0.0062ms | 0.0034ms | +0.0028ms | +81.31% |
| min | 0.0026ms | 0.0026ms | +0.000031ms | +1.19% |
| max | 0.06ms | 0.02ms | +0.03ms | +139.38% |
| total | 1.24ms | 0.68ms | +0.56ms | +81.31% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.23ms |
| p99 | 0.43ms |
| mean | 0.06ms |
| stdev | 0.10ms |
| min | 0.01ms |
| max | 0.87ms |
| total | 11.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.826)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00032ms | +3.16% |
| p50 | 0.01ms | 0.01ms | +0.0024ms | +22.86% |
| p95 | 0.19ms | 0.03ms | +0.16ms | +562.42% |
| p99 | 0.36ms | 0.06ms | +0.30ms | +496.92% |
| mean | 0.05ms | 0.01ms | +0.03ms | +236.37% |
| min | 0.0098ms | 0.0095ms | +0.00026ms | +2.74% |
| max | 0.72ms | 0.13ms | +0.59ms | +451.38% |
| total | 9.48ms | 2.82ms | +6.66ms | +236.37% |

