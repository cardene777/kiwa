# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00038ms | 0.0028ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00046ms | 0.0011ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00050ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00083ms | 0.0035ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeGinHandler | cpu | 0.09ms | 0.09ms | 0.00038ms | 0.004 | 0.005 | 0.00035ms | 0.00038ms |
| invokeEchoHandler | cpu | 0.08ms | 0.09ms | 0.00046ms | 0.005 | 0.006 | 0.00044ms | 0.00046ms |
| invokeFiberHandler | cpu | 0.08ms | 0.09ms | 0.00050ms | 0.006 | 0.006 | 0.00049ms | 0.00050ms |
| captureChiRoute | cpu | 0.09ms | 0.11ms | 0.00083ms | 0.009 | 0.009 | 0.00073ms | 0.00071ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.02ms | 10ms | PASS |
| invokeEchoHandler | 0.01ms | 10ms | PASS |
| invokeFiberHandler | 0.01ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeGinHandler | -8592 B | 0 B | 102400 B | yes | PASS |
| invokeEchoHandler | -20704 B | 0 B | 102400 B | yes | PASS |
| invokeFiberHandler | 2680 B | 0 B | 102400 B | yes | PASS |
| captureChiRoute | 7168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0028ms |
| p99 | 0.0049ms |
| mean | 0.00086ms |
| stdev | 0.0013ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.927)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00035ms | 0.00038ms | -0.000027ms | -7.30% |
| p50 | 0.00039ms | 0.00042ms | -0.000030ms | -7.19% |
| p95 | 0.0026ms | 0.0034ms | -0.00080ms | -23.33% |
| p99 | 0.0045ms | 0.0088ms | -0.0043ms | -48.49% |
| mean | 0.00080ms | 0.00091ms | -0.00012ms | -12.71% |
| min | 0.00035ms | 0.00033ms | +0.000015ms | +4.40% |
| max | 0.01ms | 0.01ms | +0.00086ms | +8.21% |
| total | 0.16ms | 0.18ms | -0.02ms | -12.71% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00058ms |
| p95 | 0.0011ms |
| p99 | 0.0058ms |
| mean | 0.0013ms |
| stdev | 0.0081ms |
| min | 0.00046ms |
| max | 0.11ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.969)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00044ms | 0.00046ms | -0.000013ms | -2.84% |
| p50 | 0.00057ms | 0.00050ms | +0.000065ms | +13.04% |
| p95 | 0.0010ms | 0.0020ms | -0.0010ms | -50.04% |
| p99 | 0.0056ms | 0.0079ms | -0.0023ms | -28.68% |
| mean | 0.0012ms | 0.00082ms | +0.00043ms | +52.10% |
| min | 0.00044ms | 0.00038ms | +0.000069ms | +18.40% |
| max | 0.11ms | 0.01ms | +0.10ms | +656.75% |
| total | 0.25ms | 0.16ms | +0.09ms | +52.10% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0012ms |
| p99 | 0.0059ms |
| mean | 0.00086ms |
| stdev | 0.0019ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00049ms | 0.00050ms | -0.0000055ms | -1.10% |
| p50 | 0.00058ms | 0.00054ms | +0.000035ms | +6.38% |
| p95 | 0.0012ms | 0.0024ms | -0.0012ms | -49.31% |
| p99 | 0.0059ms | 0.01ms | -0.0084ms | -58.90% |
| mean | 0.00085ms | 0.0010ms | -0.00018ms | -17.41% |
| min | 0.00045ms | 0.00046ms | -0.0000051ms | -1.10% |
| max | 0.02ms | 0.02ms | +0.0028ms | +13.75% |
| total | 0.17ms | 0.20ms | -0.04ms | -17.41% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00092ms |
| p95 | 0.0035ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0026ms |
| min | 0.00075ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.876)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00073ms | 0.00071ms | +0.000022ms | +3.07% |
| p50 | 0.00080ms | 0.00075ms | +0.000053ms | +7.11% |
| p95 | 0.0031ms | 0.0045ms | -0.0015ms | -31.98% |
| p99 | 0.01ms | 0.01ms | -0.0010ms | -7.41% |
| mean | 0.0013ms | 0.0014ms | -0.000096ms | -6.69% |
| min | 0.00066ms | 0.00071ms | -0.000051ms | -7.20% |
| max | 0.02ms | 0.02ms | -0.0039ms | -16.37% |
| total | 0.27ms | 0.29ms | -0.02ms | -6.69% |

