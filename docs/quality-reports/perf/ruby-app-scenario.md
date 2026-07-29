# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0056ms | 0.01ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0056ms | 0.0085ms | 100ms | 0.00049ms | PASS | stable (p10 +14% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0026ms | 0.0031ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 12008 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 1448 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | 568 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0056ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.0018ms |
| min | 0.0056ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0075ms | -0.0018ms | -24.59% |
| p50 | 0.0060ms | 0.0077ms | -0.0018ms | -22.71% |
| p95 | 0.01ms | 0.01ms | -0.00066ms | -5.96% |
| p99 | 0.01ms | 0.01ms | -0.00046ms | -3.99% |
| mean | 0.0070ms | 0.0085ms | -0.0015ms | -17.48% |
| min | 0.0056ms | 0.0074ms | -0.0018ms | -24.70% |
| max | 0.01ms | 0.01ms | -0.00042ms | -3.53% |
| total | 0.14ms | 0.17ms | -0.03ms | -17.48% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0056ms |
| p50 | 0.0065ms |
| p95 | 0.0085ms |
| p99 | 0.0085ms |
| mean | 0.0066ms |
| stdev | 0.00090ms |
| min | 0.0055ms |
| max | 0.0085ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0049ms | +0.00070ms | +14.34% |
| p50 | 0.0065ms | 0.0050ms | +0.0015ms | +30.31% |
| p95 | 0.0085ms | 0.0058ms | +0.0026ms | +45.04% |
| p99 | 0.0085ms | 0.0058ms | +0.0027ms | +45.59% |
| mean | 0.0066ms | 0.0051ms | +0.0015ms | +28.82% |
| min | 0.0055ms | 0.0049ms | +0.00062ms | +12.82% |
| max | 0.0085ms | 0.0058ms | +0.0027ms | +45.72% |
| total | 0.13ms | 0.10ms | +0.03ms | +28.82% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0026ms |
| p95 | 0.0031ms |
| p99 | 0.0035ms |
| mean | 0.0027ms |
| stdev | 0.00023ms |
| min | 0.0026ms |
| max | 0.0035ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0024ms | +0.00021ms | +8.80% |
| p50 | 0.0026ms | 0.0024ms | +0.00021ms | +8.61% |
| p95 | 0.0031ms | 0.0032ms | -0.000085ms | -2.67% |
| p99 | 0.0035ms | 0.0036ms | -0.00012ms | -3.28% |
| mean | 0.0027ms | 0.0026ms | +0.00016ms | +6.27% |
| min | 0.0026ms | 0.0024ms | +0.00021ms | +8.76% |
| max | 0.0035ms | 0.0037ms | -0.00013ms | -3.41% |
| total | 0.05ms | 0.05ms | +0.0032ms | +6.27% |

