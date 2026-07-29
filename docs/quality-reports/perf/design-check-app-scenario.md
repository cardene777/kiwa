# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.51ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +145%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 50ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 50ms | PASS | stable (差 0.17ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 2.28ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.11ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.23ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -37912 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 176 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 8760 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.15ms |
| p95 | 0.51ms |
| p99 | 1.29ms |
| mean | 0.26ms |
| stdev | 0.28ms |
| min | 0.12ms |
| max | 1.58ms |
| total | 7.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.15ms | 0.14ms | +0.02ms | +12.98% |
| p95 | 0.51ms | 0.34ms | +0.16ms | +46.53% |
| p99 | 1.29ms | 1.15ms | +0.14ms | +11.79% |
| mean | 0.26ms | 0.18ms | +0.08ms | +45.59% |
| min | 0.12ms | 0.10ms | +0.02ms | +17.27% |
| max | 1.58ms | 2.45ms | -0.86ms | -35.28% |
| total | 7.90ms | 36.15ms | -28.26ms | -78.16% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +4.34% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -21.51% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -16.31% |
| mean | 0.03ms | 0.03ms | -0.00ms | -7.84% |
| min | 0.03ms | 0.02ms | +0.00ms | +6.42% |
| max | 0.03ms | 0.07ms | -0.03ms | -49.05% |
| total | 0.82ms | 5.90ms | -5.08ms | -86.18% |

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
| max | 0.06ms |
| total | 1.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | -0.00ms | -1.80% |
| p95 | 0.05ms | 0.22ms | -0.17ms | -75.39% |
| p99 | 0.06ms | 0.67ms | -0.61ms | -91.27% |
| mean | 0.05ms | 0.10ms | -0.04ms | -45.15% |
| min | 0.05ms | 0.05ms | +0.00ms | +3.91% |
| max | 0.06ms | 2.54ms | -2.48ms | -97.65% |
| total | 1.61ms | 19.60ms | -17.98ms | -91.77% |

