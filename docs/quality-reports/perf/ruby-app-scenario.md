# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.01ms | 100ms | PASS | stable |
| multi_framework_batch (4 framework dispatch x2) | 0.01ms | 100ms | PASS | stable |
| erb_render_missing_key (5 render + missing collect) | 0.00ms | 100ms | PASS | improved |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 991216 B | 0 B | 102400 B | PASS |
| multi_framework_batch (4 framework dispatch x2) | 448344 B | 0 B | 102400 B | PASS |
| erb_render_missing_key (5 render + missing collect) | 131784 B | 0 B | 102400 B | PASS |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.72% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +10.83% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +42.49% |
| mean | 0.01ms | 0.01ms | +0.00ms | +2.67% |
| min | 0.01ms | 0.01ms | -0.00ms | -10.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +50.38% |
| total | 0.15ms | 0.15ms | +0.00ms | +2.67% |

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
| p50 | 0.01ms | 0.00ms | +0.00ms | +35.65% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +10.97% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.41% |
| mean | 0.01ms | 0.01ms | +0.00ms | +16.35% |
| min | 0.00ms | 0.00ms | +0.00ms | +18.92% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.65% |
| total | 0.12ms | 0.10ms | +0.02ms | +16.35% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.16% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -39.79% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -51.49% |
| mean | 0.00ms | 0.00ms | -0.00ms | -20.27% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.43% |
| max | 0.00ms | 0.01ms | -0.00ms | -53.74% |
| total | 0.05ms | 0.06ms | -0.01ms | -20.27% |

