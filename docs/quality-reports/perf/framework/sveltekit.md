# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoad | 0.00063ms | 0.0024ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.01ms | 0.04ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeLoad | cpu | 0.08ms | 0.00063ms | 0.008 | 0.008 | 0.00063ms | 0.00063ms |
| invokeAction | cpu | 0.08ms | 0.01ms | 0.132 | 0.131 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.01ms | 10ms | PASS |
| invokeAction | 0.15ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -8584 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -97560 B | -31958 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00071ms |
| p95 | 0.0024ms |
| p99 | 0.0074ms |
| mean | 0.0010ms |
| stdev | 0.0014ms |
| min | 0.00058ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p50 | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| p95 | 0.0024ms | 0.0070ms | -0.0046ms | -65.52% |
| p99 | 0.0074ms | 0.02ms | -0.01ms | -66.74% |
| mean | 0.0010ms | 0.0017ms | -0.00070ms | -41.14% |
| min | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.03ms | -0.0094ms | -37.36% |
| total | 0.20ms | 0.34ms | -0.14ms | -41.14% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 3.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00021ms | -1.93% |
| p50 | 0.01ms | 0.01ms | -0.00052ms | -4.26% |
| p95 | 0.04ms | 0.05ms | -0.02ms | -29.27% |
| p99 | 0.11ms | 0.11ms | -0.0022ms | -2.02% |
| mean | 0.02ms | 0.02ms | -0.0024ms | -12.86% |
| min | 0.01ms | 0.01ms | -0.00013ms | -1.21% |
| max | 0.12ms | 0.21ms | -0.08ms | -41.36% |
| total | 3.25ms | 3.73ms | -0.48ms | -12.86% |

