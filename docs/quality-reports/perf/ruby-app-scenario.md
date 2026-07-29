# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0055ms | 0.01ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0039ms | 0.0060ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0024ms | 0.0040ms | 100ms | 0.00050ms | PASS | stable (p10 -1% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | -275600 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 2304 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -1864 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0058ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0068ms |
| stdev | 0.0017ms |
| min | 0.0055ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0075ms | -0.0019ms | -25.70% |
| p50 | 0.0058ms | 0.0077ms | -0.0019ms | -24.32% |
| p95 | 0.01ms | 0.01ms | -0.00072ms | -6.52% |
| p99 | 0.01ms | 0.01ms | -0.00084ms | -7.24% |
| mean | 0.0068ms | 0.0085ms | -0.0016ms | -19.37% |
| min | 0.0055ms | 0.0074ms | -0.0019ms | -25.84% |
| max | 0.01ms | 0.01ms | -0.00087ms | -7.41% |
| total | 0.14ms | 0.17ms | -0.03ms | -19.37% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0039ms |
| p50 | 0.0040ms |
| p95 | 0.0060ms |
| p99 | 0.0093ms |
| mean | 0.0047ms |
| stdev | 0.0014ms |
| min | 0.0038ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0049ms | -0.0010ms | -21.26% |
| p50 | 0.0040ms | 0.0050ms | -0.0010ms | -20.33% |
| p95 | 0.0060ms | 0.0058ms | +0.00021ms | +3.64% |
| p99 | 0.0093ms | 0.0058ms | +0.0034ms | +59.02% |
| mean | 0.0047ms | 0.0051ms | -0.00047ms | -9.23% |
| min | 0.0038ms | 0.0049ms | -0.0011ms | -22.22% |
| max | 0.01ms | 0.0058ms | +0.0043ms | +72.86% |
| total | 0.09ms | 0.10ms | -0.0095ms | -9.23% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0024ms |
| p95 | 0.0040ms |
| p99 | 0.0067ms |
| mean | 0.0028ms |
| stdev | 0.0011ms |
| min | 0.0022ms |
| max | 0.0074ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | -0.000017ms | -0.70% |
| p50 | 0.0024ms | 0.0024ms | +0.000020ms | +0.83% |
| p95 | 0.0040ms | 0.0032ms | +0.00082ms | +25.66% |
| p99 | 0.0067ms | 0.0036ms | +0.0031ms | +87.67% |
| mean | 0.0028ms | 0.0026ms | +0.00025ms | +9.85% |
| min | 0.0022ms | 0.0024ms | -0.00021ms | -8.76% |
| max | 0.0074ms | 0.0037ms | +0.0037ms | +101.17% |
| total | 0.06ms | 0.05ms | +0.0050ms | +9.85% |

