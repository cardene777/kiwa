# Perf Suite — ruby-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 2.88ms | 100ms | PASS | regressed — gate 無効 (regressionGate=false) |
| multi_framework_batch (4 framework dispatch x2) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5862%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| erb_render_missing_key (5 render + missing collect) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +13335%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 0.04ms | 200ms | PASS |
| multi_framework_batch (4 framework dispatch x2) | 0.03ms | 200ms | PASS |
| erb_render_missing_key (5 render + missing collect) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rails_crud_workflow (10 dispatch with AR log) | 3200 B | -11169 B | 102400 B | yes | PASS |
| multi_framework_batch (4 framework dispatch x2) | 2480 B | 0 B | 102400 B | yes | PASS |
| erb_render_missing_key (5 render + missing collect) | 8744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rails_crud_workflow (10 dispatch with AR log)

# Perf Report — rails_crud_workflow (10 dispatch with AR log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 2.88ms |
| p99 | 3.59ms |
| mean | 0.47ms |
| stdev | 1.12ms |
| min | 0.01ms |
| max | 3.76ms |
| total | 9.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +30.88% |
| p95 | 2.88ms | 0.02ms | +2.86ms | +17803.34% |
| p99 | 3.59ms | 0.06ms | +3.52ms | +5642.97% |
| mean | 0.47ms | 0.01ms | +0.46ms | +3869.45% |
| min | 0.01ms | 0.01ms | -0.00ms | -10.01% |
| max | 3.76ms | 0.07ms | +3.69ms | +4982.25% |
| total | 9.35ms | 0.24ms | +9.11ms | +3869.45% |

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
| min | 0.01ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.96% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +42.00% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +28.81% |
| mean | 0.01ms | 0.01ms | +0.00ms | +18.15% |
| min | 0.01ms | 0.00ms | +0.00ms | +10.99% |
| max | 0.01ms | 0.01ms | +0.00ms | +26.17% |
| total | 0.14ms | 0.12ms | +0.02ms | +18.15% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -23.75% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -26.10% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.13% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.75% |
| max | 0.00ms | 0.00ms | -0.00ms | -26.58% |
| total | 0.05ms | 0.06ms | -0.01ms | -12.13% |

