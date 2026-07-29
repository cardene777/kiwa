# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.0057ms | 0.01ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.0039ms | 0.0079ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.0023ms | 0.0045ms | 100ms | 0.00050ms | PASS | stable (p10 -4% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 19648 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 2304 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -1960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0065ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0078ms |
| stdev | 0.0029ms |
| min | 0.0057ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0075ms | -0.0017ms | -22.91% |
| p50 | 0.0065ms | 0.0077ms | -0.0012ms | -15.68% |
| p95 | 0.01ms | 0.01ms | +0.00076ms | +6.89% |
| p99 | 0.02ms | 0.01ms | +0.0047ms | +40.28% |
| mean | 0.0078ms | 0.0085ms | -0.00069ms | -8.14% |
| min | 0.0057ms | 0.0074ms | -0.0017ms | -23.02% |
| max | 0.02ms | 0.01ms | +0.0057ms | +48.06% |
| total | 0.16ms | 0.17ms | -0.01ms | -8.14% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0039ms |
| p50 | 0.0049ms |
| p95 | 0.0079ms |
| p99 | 0.0089ms |
| mean | 0.0053ms |
| stdev | 0.0014ms |
| min | 0.0039ms |
| max | 0.0091ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0049ms | -0.0010ms | -20.32% |
| p50 | 0.0049ms | 0.0050ms | -0.00012ms | -2.48% |
| p95 | 0.0079ms | 0.0058ms | +0.0021ms | +36.08% |
| p99 | 0.0089ms | 0.0058ms | +0.0031ms | +52.37% |
| mean | 0.0053ms | 0.0051ms | +0.00020ms | +3.92% |
| min | 0.0039ms | 0.0049ms | -0.00096ms | -19.67% |
| max | 0.0091ms | 0.0058ms | +0.0033ms | +56.44% |
| total | 0.11ms | 0.10ms | +0.0040ms | +3.92% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0025ms |
| p95 | 0.0045ms |
| p99 | 0.0046ms |
| mean | 0.0028ms |
| stdev | 0.00067ms |
| min | 0.0022ms |
| max | 0.0046ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0024ms | -0.000088ms | -3.71% |
| p50 | 0.0025ms | 0.0024ms | +0.000083ms | +3.43% |
| p95 | 0.0045ms | 0.0032ms | +0.0013ms | +41.11% |
| p99 | 0.0046ms | 0.0036ms | +0.0010ms | +27.91% |
| mean | 0.0028ms | 0.0026ms | +0.00020ms | +7.66% |
| min | 0.0022ms | 0.0024ms | -0.00013ms | -5.26% |
| max | 0.0046ms | 0.0037ms | +0.00092ms | +25.04% |
| total | 0.06ms | 0.05ms | +0.0039ms | +7.66% |

