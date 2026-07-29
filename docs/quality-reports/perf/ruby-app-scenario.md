# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0060ms | 0.01ms | 100ms | 0.00049ms | PASS | stable (p10 -20% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0048ms | 0.0056ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0024ms | 0.0032ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.15ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 16856 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 3088 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -1960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0080ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0090ms |
| stdev | 0.0027ms |
| min | 0.0059ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0075ms | -0.0015ms | -20.17% |
| p50 | 0.0080ms | 0.0077ms | +0.00031ms | +4.05% |
| p95 | 0.01ms | 0.01ms | +0.0028ms | +25.69% |
| p99 | 0.01ms | 0.01ms | +0.0034ms | +28.94% |
| mean | 0.0090ms | 0.0085ms | +0.00053ms | +6.30% |
| min | 0.0059ms | 0.0074ms | -0.0015ms | -20.78% |
| max | 0.02ms | 0.01ms | +0.0035ms | +29.69% |
| total | 0.18ms | 0.17ms | +0.01ms | +6.30% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0048ms |
| p50 | 0.0049ms |
| p95 | 0.0056ms |
| p99 | 0.0059ms |
| mean | 0.0050ms |
| stdev | 0.00030ms |
| min | 0.0048ms |
| max | 0.0060ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0049ms | -0.000083ms | -1.69% |
| p50 | 0.0049ms | 0.0050ms | -0.000083ms | -1.65% |
| p95 | 0.0056ms | 0.0058ms | -0.00023ms | -3.91% |
| p99 | 0.0059ms | 0.0058ms | +0.000088ms | +1.51% |
| mean | 0.0050ms | 0.0051ms | -0.00012ms | -2.43% |
| min | 0.0048ms | 0.0049ms | -0.000083ms | -1.70% |
| max | 0.0060ms | 0.0058ms | +0.00017ms | +2.86% |
| total | 0.10ms | 0.10ms | -0.0025ms | -2.43% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0032ms |
| p99 | 0.0033ms |
| mean | 0.0026ms |
| stdev | 0.00029ms |
| min | 0.0023ms |
| max | 0.0033ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | 0.00ms | 0.00% |
| p50 | 0.0025ms | 0.0024ms | +0.000041ms | +1.72% |
| p95 | 0.0032ms | 0.0032ms | -0.000017ms | -0.52% |
| p99 | 0.0033ms | 0.0036ms | -0.00027ms | -7.55% |
| mean | 0.0026ms | 0.0026ms | +0.000019ms | +0.73% |
| min | 0.0023ms | 0.0024ms | -0.000042ms | -1.77% |
| max | 0.0033ms | 0.0037ms | -0.00033ms | -9.08% |
| total | 0.05ms | 0.05ms | +0.00038ms | +0.73% |

