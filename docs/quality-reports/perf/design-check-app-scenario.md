# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.40ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +145%) 以上の悪化が必要) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +1402%) 以上の悪化が必要) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 50ms | PASS | stable (差 0.17ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.27ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.12ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.22ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -70464 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 467480 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 776 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.16ms |
| p95 | 0.40ms |
| p99 | 0.42ms |
| mean | 0.21ms |
| stdev | 0.10ms |
| min | 0.13ms |
| max | 0.42ms |
| total | 6.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.16ms | 0.14ms | +0.02ms | +16.24% |
| p95 | 0.40ms | 0.34ms | +0.05ms | +15.13% |
| p99 | 0.42ms | 1.15ms | -0.73ms | -63.48% |
| mean | 0.21ms | 0.18ms | +0.03ms | +17.93% |
| min | 0.13ms | 0.10ms | +0.03ms | +27.82% |
| max | 0.42ms | 2.45ms | -2.02ms | -82.65% |
| total | 6.40ms | 36.15ms | -29.76ms | -82.31% |

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
| max | 0.04ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.00ms | -8.68% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -22.68% |
| p99 | 0.03ms | 0.04ms | -0.00ms | -11.54% |
| mean | 0.02ms | 0.03ms | -0.01ms | -17.33% |
| min | 0.02ms | 0.02ms | -0.00ms | -5.74% |
| max | 0.04ms | 0.07ms | -0.03ms | -45.23% |
| total | 0.73ms | 5.90ms | -5.17ms | -87.60% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.00ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | -0.00ms | -8.30% |
| p95 | 0.05ms | 0.22ms | -0.17ms | -76.16% |
| p99 | 0.06ms | 0.67ms | -0.60ms | -90.40% |
| mean | 0.05ms | 0.10ms | -0.05ms | -48.30% |
| min | 0.05ms | 0.05ms | -0.00ms | -4.57% |
| max | 0.07ms | 2.54ms | -2.47ms | -97.31% |
| total | 1.52ms | 19.60ms | -18.08ms | -92.25% |

