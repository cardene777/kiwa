# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.41ms | 100ms | PASS | stable |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.04ms | 50ms | PASS | stable |
| regression_scan_burst (50 element layout × 10 iter) | 0.06ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.46ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.17ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.23ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -37480 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | -1632 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.14ms |
| p95 | 0.41ms |
| p99 | 0.44ms |
| mean | 0.20ms |
| stdev | 0.11ms |
| min | 0.13ms |
| max | 0.45ms |
| total | 5.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.15ms | -0.01ms | -8.93% |
| p95 | 0.41ms | 0.63ms | -0.21ms | -33.87% |
| p99 | 0.44ms | 0.71ms | -0.27ms | -37.71% |
| mean | 0.20ms | 0.27ms | -0.07ms | -27.27% |
| min | 0.13ms | 0.12ms | +0.01ms | +5.30% |
| max | 0.45ms | 0.75ms | -0.30ms | -39.74% |
| total | 5.88ms | 8.09ms | -2.21ms | -27.27% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -2.21% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -3.23% |
| p99 | 0.04ms | 0.04ms | -0.00ms | -9.83% |
| mean | 0.03ms | 0.03ms | -0.00ms | -3.88% |
| min | 0.03ms | 0.03ms | -0.00ms | -7.01% |
| max | 0.04ms | 0.05ms | -0.01ms | -12.66% |
| total | 0.98ms | 1.02ms | -0.04ms | -3.88% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.00ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.06ms | -0.00ms | -3.75% |
| p95 | 0.06ms | 0.08ms | -0.03ms | -30.95% |
| p99 | 0.06ms | 0.11ms | -0.05ms | -47.11% |
| mean | 0.05ms | 0.06ms | -0.01ms | -9.03% |
| min | 0.05ms | 0.05ms | -0.00ms | -0.88% |
| max | 0.06ms | 0.12ms | -0.06ms | -51.02% |
| total | 1.64ms | 1.80ms | -0.16ms | -9.03% |

