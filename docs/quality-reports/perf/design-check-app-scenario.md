# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.40ms | 100ms | PASS | stable |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 50ms | PASS | improved |
| regression_scan_burst (50 element layout × 10 iter) | 0.06ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.14ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.12ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.21ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 13926264 B | 0 B | 102400 B | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 3637368 B | 0 B | 102400 B | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 2268896 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.14ms |
| p95 | 0.40ms |
| p99 | 0.42ms |
| mean | 0.19ms |
| stdev | 0.10ms |
| min | 0.11ms |
| max | 0.42ms |
| total | 5.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.13ms | +0.01ms | +6.03% |
| p95 | 0.40ms | 0.40ms | -0.00ms | -1.01% |
| p99 | 0.42ms | 0.42ms | -0.00ms | -0.79% |
| mean | 0.19ms | 0.19ms | +0.00ms | +2.58% |
| min | 0.11ms | 0.11ms | -0.00ms | -0.78% |
| max | 0.42ms | 0.42ms | -0.00ms | -0.71% |
| total | 5.77ms | 5.62ms | +0.14ms | +2.58% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.01ms | -21.39% |
| p95 | 0.03ms | 0.04ms | -0.02ms | -36.71% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -49.64% |
| mean | 0.02ms | 0.03ms | -0.01ms | -27.67% |
| min | 0.02ms | 0.03ms | -0.00ms | -15.12% |
| max | 0.03ms | 0.06ms | -0.03ms | -52.57% |
| total | 0.74ms | 1.02ms | -0.28ms | -27.67% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.10ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.12ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | -0.00ms | -2.00% |
| p95 | 0.06ms | 0.05ms | +0.01ms | +12.16% |
| p99 | 0.10ms | 0.05ms | +0.05ms | +99.64% |
| mean | 0.05ms | 0.05ms | +0.00ms | +3.30% |
| min | 0.05ms | 0.05ms | -0.00ms | -3.33% |
| max | 0.12ms | 0.05ms | +0.07ms | +132.78% |
| total | 1.52ms | 1.47ms | +0.05ms | +3.30% |

