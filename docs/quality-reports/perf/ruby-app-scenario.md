# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0061ms | 0.01ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0045ms | 0.0063ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0022ms | 0.0087ms | 100ms | 0.00058ms | PASS | stable (p10 -5% (閾値未満)、 p95 +174% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 13088 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 2728 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -1960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0061ms |
| p50 | 0.0063ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0079ms |
| stdev | 0.0031ms |
| min | 0.0060ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0075ms | -0.0013ms | -17.99% |
| p50 | 0.0063ms | 0.0077ms | -0.0014ms | -17.84% |
| p95 | 0.01ms | 0.01ms | +0.0012ms | +10.79% |
| p99 | 0.02ms | 0.01ms | +0.0059ms | +51.05% |
| mean | 0.0079ms | 0.0085ms | -0.00053ms | -6.29% |
| min | 0.0060ms | 0.0074ms | -0.0014ms | -19.09% |
| max | 0.02ms | 0.01ms | +0.0071ms | +60.44% |
| total | 0.16ms | 0.17ms | -0.01ms | -6.29% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0052ms |
| p95 | 0.0063ms |
| p99 | 0.01ms |
| mean | 0.0055ms |
| stdev | 0.0015ms |
| min | 0.0042ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0049ms | -0.00045ms | -9.06% |
| p50 | 0.0052ms | 0.0050ms | +0.00017ms | +3.33% |
| p95 | 0.0063ms | 0.0058ms | +0.00044ms | +7.61% |
| p99 | 0.01ms | 0.0058ms | +0.0047ms | +79.81% |
| mean | 0.0055ms | 0.0051ms | +0.00032ms | +6.27% |
| min | 0.0042ms | 0.0049ms | -0.00071ms | -14.54% |
| max | 0.01ms | 0.0058ms | +0.0057ms | +97.86% |
| total | 0.11ms | 0.10ms | +0.0065ms | +6.27% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0025ms |
| p95 | 0.0087ms |
| p99 | 0.01ms |
| mean | 0.0035ms |
| stdev | 0.0030ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0024ms | -0.00013ms | -5.26% |
| p50 | 0.0025ms | 0.0024ms | +0.00010ms | +4.30% |
| p95 | 0.0087ms | 0.0032ms | +0.0055ms | +173.81% |
| p99 | 0.01ms | 0.0036ms | +0.01ms | +282.17% |
| mean | 0.0035ms | 0.0026ms | +0.00098ms | +38.22% |
| min | 0.0022ms | 0.0024ms | -0.00017ms | -7.03% |
| max | 0.01ms | 0.0037ms | +0.01ms | +305.76% |
| total | 0.07ms | 0.05ms | +0.02ms | +38.22% |

