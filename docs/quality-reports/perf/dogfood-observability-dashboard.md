# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| refreshDashboard | 0.0027ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runQuery | 0.00079ms | 0.0070ms | 20ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| refreshDashboard | cpu | 0.08ms | 0.0027ms | 0.033 | 0.035 | 0.0026ms | 0.0028ms |
| runQuery | cpu | 0.08ms | 0.00079ms | 0.010 | 0.014 | 0.00081ms | 0.0011ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.05ms | 60ms | PASS |
| runQuery | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| refreshDashboard | 19144 B | 0 B | 102400 B | yes | PASS |
| runQuery | 16648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### refreshDashboard

# Perf Report — refreshDashboard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0043ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0051ms |
| stdev | 0.0032ms |
| min | 0.0026ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0028ms | -0.000084ms | -3.01% |
| p50 | 0.0043ms | 0.0044ms | -0.00010ms | -2.37% |
| p95 | 0.01ms | 0.01ms | -0.00041ms | -3.49% |
| p99 | 0.02ms | 0.02ms | +0.0012ms | +8.02% |
| mean | 0.0051ms | 0.0051ms | -0.0000072ms | -0.14% |
| min | 0.0026ms | 0.0027ms | -0.000041ms | -1.54% |
| max | 0.02ms | 0.02ms | +0.0017ms | +9.95% |
| total | 0.21ms | 0.21ms | -0.00029ms | -0.14% |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.0012ms |
| p95 | 0.0070ms |
| p99 | 0.0086ms |
| mean | 0.0019ms |
| stdev | 0.0019ms |
| min | 0.00071ms |
| max | 0.0091ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.0011ms | -0.00033ms | -29.79% |
| p50 | 0.0012ms | 0.0015ms | -0.00031ms | -21.12% |
| p95 | 0.0070ms | 0.02ms | -0.01ms | -63.89% |
| p99 | 0.0086ms | 0.03ms | -0.02ms | -71.12% |
| mean | 0.0019ms | 0.0042ms | -0.0023ms | -54.91% |
| min | 0.00071ms | 0.00079ms | -0.000084ms | -10.61% |
| max | 0.0091ms | 0.03ms | -0.02ms | -72.73% |
| total | 0.07ms | 0.17ms | -0.09ms | -54.91% |

