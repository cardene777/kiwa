# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3107%) 以上の悪化が必要) |
| multi_framework_batch (4 framework dispatch x2) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5862%) 以上の悪化が必要) |
| erb_render_missing_key (5 render + missing collect) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +13335%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.07ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 128 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 1448 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -1960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.65% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -24.94% |
| p99 | 0.02ms | 0.06ms | -0.05ms | -74.68% |
| mean | 0.01ms | 0.01ms | -0.00ms | -33.41% |
| min | 0.01ms | 0.01ms | -0.00ms | -17.66% |
| max | 0.02ms | 0.07ms | -0.06ms | -77.38% |
| total | 0.16ms | 0.24ms | -0.08ms | -33.41% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.40% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -1.64% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -9.71% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.88% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.90% |
| max | 0.01ms | 0.01ms | -0.00ms | -11.32% |
| total | 0.12ms | 0.12ms | -0.00ms | -1.88% |

### erb_render_missing_key (5 render + missing collect)

# Perf Report — erb_render_missing_key (5 render + missing collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -17.14% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.62% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -2.57% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.63% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.99% |
| max | 0.00ms | 0.00ms | -0.00ms | -0.90% |
| total | 0.05ms | 0.06ms | -0.01ms | -16.63% |

