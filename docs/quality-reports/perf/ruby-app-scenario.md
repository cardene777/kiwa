# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.01ms | 100ms | PASS | stable |
| multi_framework_batch (4 framework dispatch x2) | 0.01ms | 100ms | PASS | stable |
| erb_render_missing_key (5 render + missing collect) | 0.00ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 10312 B | 0 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 2656 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | -1952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +4.03% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +3.53% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -14.30% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.46% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.49% |
| max | 0.01ms | 0.01ms | -0.00ms | -17.55% |
| total | 0.14ms | 0.15ms | -0.01ms | -3.46% |

### multi_framework_batch (4 framework dispatch x2)

# Perf Report — multi_framework_batch (4 framework dispatch x2).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -4.59% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.03% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.22% |
| mean | 0.00ms | 0.01ms | -0.00ms | -6.83% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.31% |
| max | 0.01ms | 0.01ms | -0.00ms | -7.57% |
| total | 0.10ms | 0.10ms | -0.01ms | -6.83% |

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
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.21% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +28.36% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +64.40% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.91% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.02% |
| max | 0.01ms | 0.00ms | +0.00ms | +72.58% |
| total | 0.05ms | 0.05ms | +0.00ms | +1.91% |

