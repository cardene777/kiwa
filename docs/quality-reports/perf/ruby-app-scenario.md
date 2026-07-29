# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0057ms | 0.02ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0046ms | 0.0070ms | 100ms | 0.00050ms | PASS | stable (p10 -6% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0023ms | 0.0039ms | 100ms | 0.00050ms | PASS | stable (p10 -2% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.05ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 309968 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 262632 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -2984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0065ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0091ms |
| stdev | 0.0071ms |
| min | 0.0057ms |
| max | 0.04ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0075ms | -0.0018ms | -24.02% |
| p50 | 0.0065ms | 0.0077ms | -0.0012ms | -15.95% |
| p95 | 0.02ms | 0.01ms | +0.0048ms | +43.29% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +184.13% |
| mean | 0.0091ms | 0.0085ms | +0.00059ms | +7.01% |
| min | 0.0057ms | 0.0074ms | -0.0017ms | -23.60% |
| max | 0.04ms | 0.01ms | +0.03ms | +216.98% |
| total | 0.18ms | 0.17ms | +0.01ms | +7.01% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0046ms |
| p50 | 0.0058ms |
| p95 | 0.0070ms |
| p99 | 0.0093ms |
| mean | 0.0058ms |
| stdev | 0.0012ms |
| min | 0.0046ms |
| max | 0.0099ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0049ms | -0.00030ms | -6.00% |
| p50 | 0.0058ms | 0.0050ms | +0.00077ms | +15.37% |
| p95 | 0.0070ms | 0.0058ms | +0.0012ms | +20.47% |
| p99 | 0.0093ms | 0.0058ms | +0.0035ms | +60.11% |
| mean | 0.0058ms | 0.0051ms | +0.00064ms | +12.51% |
| min | 0.0046ms | 0.0049ms | -0.00029ms | -5.99% |
| max | 0.0099ms | 0.0058ms | +0.0041ms | +70.02% |
| total | 0.12ms | 0.10ms | +0.01ms | +12.51% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0026ms |
| p95 | 0.0039ms |
| p99 | 0.0053ms |
| mean | 0.0028ms |
| stdev | 0.00079ms |
| min | 0.0023ms |
| max | 0.0056ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0024ms | -0.000042ms | -1.77% |
| p50 | 0.0026ms | 0.0024ms | +0.00015ms | +6.02% |
| p95 | 0.0039ms | 0.0032ms | +0.00069ms | +21.64% |
| p99 | 0.0053ms | 0.0036ms | +0.0017ms | +47.75% |
| mean | 0.0028ms | 0.0026ms | +0.00028ms | +11.00% |
| min | 0.0023ms | 0.0024ms | -0.000083ms | -3.49% |
| max | 0.0056ms | 0.0037ms | +0.0020ms | +53.44% |
| total | 0.06ms | 0.05ms | +0.0056ms | +11.00% |

