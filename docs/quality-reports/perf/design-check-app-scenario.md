# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.43ms | 100ms | PASS | stable |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.04ms | 50ms | PASS | stable |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.47ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.14ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.24ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -37552 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | -1088 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | -2432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.14ms |
| p95 | 0.43ms |
| p99 | 0.46ms |
| mean | 0.20ms |
| stdev | 0.12ms |
| min | 0.11ms |
| max | 0.47ms |
| total | 6.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.15ms | -0.01ms | -6.23% |
| p95 | 0.43ms | 0.63ms | -0.20ms | -32.07% |
| p99 | 0.46ms | 0.71ms | -0.26ms | -35.87% |
| mean | 0.20ms | 0.27ms | -0.07ms | -24.50% |
| min | 0.11ms | 0.12ms | -0.01ms | -8.81% |
| max | 0.47ms | 0.75ms | -0.28ms | -37.16% |
| total | 6.11ms | 8.09ms | -1.98ms | -24.50% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -3.28% |
| p95 | 0.04ms | 0.04ms | +0.01ms | +17.33% |
| p99 | 0.06ms | 0.04ms | +0.01ms | +29.21% |
| mean | 0.03ms | 0.03ms | -0.00ms | -0.95% |
| min | 0.03ms | 0.03ms | -0.00ms | -7.14% |
| max | 0.06ms | 0.05ms | +0.01ms | +29.27% |
| total | 1.01ms | 1.02ms | -0.01ms | -0.95% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.05ms |
| stdev | 0.00ms |
| min | 0.05ms |
| max | 0.05ms |
| total | 1.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.06ms | -0.01ms | -11.67% |
| p95 | 0.05ms | 0.08ms | -0.03ms | -38.27% |
| p99 | 0.05ms | 0.11ms | -0.06ms | -51.80% |
| mean | 0.05ms | 0.06ms | -0.01ms | -16.51% |
| min | 0.05ms | 0.05ms | -0.00ms | -6.39% |
| max | 0.05ms | 0.12ms | -0.06ms | -54.95% |
| total | 1.50ms | 1.80ms | -0.30ms | -16.51% |

