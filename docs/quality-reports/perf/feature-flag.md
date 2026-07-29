# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00038ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00092ms | 0.0017ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| registerRule | 0.00017ms | 0.00095ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +204%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| evaluateFlag | cpu | 0.08ms | 0.00038ms | 0.005 | 0.005 | 0.00038ms | 0.00038ms |
| evaluateAllFlags | cpu | 0.08ms | 0.00092ms | 0.011 | 0.012 | 0.00094ms | 0.00096ms |
| registerRule | cpu | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00017ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.03ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 23952 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 71448 B | 0 B | 102400 B | yes | PASS |
| registerRule | 20064 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0012ms |
| p99 | 0.01ms |
| mean | 0.00078ms |
| stdev | 0.0019ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p95 | 0.0012ms | 0.0038ms | -0.0026ms | -68.44% |
| p99 | 0.01ms | 0.02ms | -0.0066ms | -34.72% |
| mean | 0.00078ms | 0.0013ms | -0.00053ms | -40.64% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0064ms | -26.69% |
| total | 0.16ms | 0.26ms | -0.11ms | -40.64% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00096ms |
| p95 | 0.0017ms |
| p99 | 0.0040ms |
| mean | 0.0011ms |
| stdev | 0.0013ms |
| min | 0.00088ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00096ms | -0.000042ms | -4.38% |
| p50 | 0.00096ms | 0.0010ms | -0.000084ms | -8.06% |
| p95 | 0.0017ms | 0.0030ms | -0.0013ms | -44.66% |
| p99 | 0.0040ms | 0.02ms | -0.02ms | -83.03% |
| mean | 0.0011ms | 0.0016ms | -0.00051ms | -31.06% |
| min | 0.00088ms | 0.00092ms | -0.000041ms | -4.48% |
| max | 0.02ms | 0.02ms | -0.0055ms | -22.78% |
| total | 0.23ms | 0.33ms | -0.10ms | -31.06% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00095ms |
| p99 | 0.0058ms |
| mean | 0.00047ms |
| stdev | 0.0016ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00095ms | 0.00090ms | +0.000048ms | +5.38% |
| p99 | 0.0058ms | 0.0081ms | -0.0024ms | -28.91% |
| mean | 0.00047ms | 0.00053ms | -0.000062ms | -11.71% |
| min | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| max | 0.02ms | 0.02ms | +0.0013ms | +8.06% |
| total | 0.09ms | 0.11ms | -0.01ms | -11.71% |

