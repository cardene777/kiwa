# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.42ms | 100ms | PASS | stable |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.06ms | 50ms | PASS | stable |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.27ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.13ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.23ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -36840 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | -3768 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.14ms |
| p95 | 0.42ms |
| p99 | 0.45ms |
| mean | 0.20ms |
| stdev | 0.12ms |
| min | 0.11ms |
| max | 0.45ms |
| total | 5.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.15ms | -0.02ms | -10.44% |
| p95 | 0.42ms | 0.63ms | -0.21ms | -33.21% |
| p99 | 0.45ms | 0.71ms | -0.26ms | -36.80% |
| mean | 0.20ms | 0.27ms | -0.07ms | -26.59% |
| min | 0.11ms | 0.12ms | -0.01ms | -9.90% |
| max | 0.45ms | 0.75ms | -0.29ms | -39.28% |
| total | 5.94ms | 8.09ms | -2.15ms | -26.59% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 1.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -5.31% |
| p95 | 0.06ms | 0.04ms | +0.02ms | +53.30% |
| p99 | 0.07ms | 0.04ms | +0.03ms | +71.78% |
| mean | 0.04ms | 0.03ms | +0.00ms | +3.47% |
| min | 0.03ms | 0.03ms | -0.00ms | -10.13% |
| max | 0.08ms | 0.05ms | +0.03ms | +68.99% |
| total | 1.06ms | 1.02ms | +0.04ms | +3.47% |

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
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.06ms | -0.01ms | -11.12% |
| p95 | 0.05ms | 0.08ms | -0.03ms | -35.42% |
| p99 | 0.05ms | 0.11ms | -0.06ms | -50.64% |
| mean | 0.05ms | 0.06ms | -0.01ms | -15.35% |
| min | 0.05ms | 0.05ms | -0.00ms | -4.31% |
| max | 0.05ms | 0.12ms | -0.06ms | -54.24% |
| total | 1.52ms | 1.80ms | -0.28ms | -15.35% |

