# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.10ms | 30ms | PASS | stable |
| security_headers_validate_loop (20 build + validate) | 0.02ms | 50ms | PASS | stable |
| production_hardening_flow (csp + security headers combined) | 0.00ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.40ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.02ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -6632 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | 488 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | -15728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.06ms |
| p95 | 0.10ms |
| p99 | 0.22ms |
| mean | 0.07ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.26ms |
| total | 2.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.05ms | +0.00ms | +1.98% |
| p95 | 0.10ms | 0.09ms | +0.01ms | +7.55% |
| p99 | 0.22ms | 0.21ms | +0.01ms | +6.30% |
| mean | 0.07ms | 0.07ms | +0.00ms | +4.31% |
| min | 0.04ms | 0.04ms | +0.00ms | +0.75% |
| max | 0.26ms | 0.25ms | +0.02ms | +6.30% |
| total | 2.11ms | 2.02ms | +0.09ms | +4.31% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.12ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.47% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +45.38% |
| p99 | 0.09ms | 0.02ms | +0.07ms | +278.48% |
| mean | 0.01ms | 0.01ms | +0.00ms | +54.96% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.94% |
| max | 0.12ms | 0.03ms | +0.09ms | +324.02% |
| total | 0.35ms | 0.23ms | +0.12ms | +54.96% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.29% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.90% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +37.26% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.89% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.50% |
| max | 0.01ms | 0.00ms | +0.00ms | +41.53% |
| total | 0.06ms | 0.06ms | -0.00ms | -2.89% |

