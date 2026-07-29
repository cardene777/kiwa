# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseGraphQLOperation | 0.00071ms | 0.0031ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| executeQuery | 0.00088ms | 0.0039ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientQuery | 0.00088ms | 0.0023ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| parseGraphQLOperation | cpu | 0.08ms | 0.00071ms | 0.008 | 0.009 | 0.00069ms | 0.00071ms |
| executeQuery | cpu | 0.08ms | 0.00088ms | 0.011 | 0.011 | 0.00086ms | 0.00088ms |
| clientQuery | cpu | 0.08ms | 0.00088ms | 0.011 | 0.012 | 0.00088ms | 0.00096ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -2160 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 6568 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 27536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00083ms |
| p95 | 0.0031ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0019ms |
| min | 0.00071ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00071ms | +0.0000010ms | +0.14% |
| p50 | 0.00083ms | 0.00092ms | -0.000084ms | -9.16% |
| p95 | 0.0031ms | 0.03ms | -0.03ms | -89.84% |
| p99 | 0.01ms | 0.06ms | -0.05ms | -82.30% |
| mean | 0.0014ms | 0.0077ms | -0.0063ms | -81.81% |
| min | 0.00071ms | 0.00067ms | +0.000041ms | +6.15% |
| max | 0.02ms | 0.30ms | -0.29ms | -94.94% |
| total | 0.28ms | 1.54ms | -1.26ms | -81.81% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0039ms |
| p99 | 0.01ms |
| mean | 0.0017ms |
| stdev | 0.0033ms |
| min | 0.00083ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00088ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p95 | 0.0039ms | 0.03ms | -0.02ms | -85.29% |
| p99 | 0.01ms | 0.07ms | -0.05ms | -79.74% |
| mean | 0.0017ms | 0.0050ms | -0.0034ms | -66.73% |
| min | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.18ms | -0.14ms | -80.86% |
| total | 0.33ms | 1.01ms | -0.67ms | -66.73% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0023ms |
| p99 | 0.0059ms |
| mean | 0.0013ms |
| stdev | 0.0021ms |
| min | 0.00083ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00096ms | -0.000083ms | -8.66% |
| p50 | 0.00092ms | 0.0010ms | -0.00013ms | -12.00% |
| p95 | 0.0023ms | 0.02ms | -0.01ms | -86.03% |
| p99 | 0.0059ms | 0.08ms | -0.08ms | -92.75% |
| mean | 0.0013ms | 0.0040ms | -0.0027ms | -67.22% |
| min | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| max | 0.02ms | 0.10ms | -0.07ms | -74.90% |
| total | 0.26ms | 0.80ms | -0.54ms | -67.22% |

