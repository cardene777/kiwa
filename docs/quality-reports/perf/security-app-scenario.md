# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.10ms | 30ms | PASS | stable |
| security_headers_validate_loop (20 build + validate) | 0.01ms | 50ms | PASS | stable |
| production_hardening_flow (csp + security headers combined) | 0.00ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.38ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.02ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -1161896 B | 0 B | 102400 B | PASS |
| security_headers_validate_loop (20 build + validate) | 381016 B | 0 B | 102400 B | PASS |
| production_hardening_flow (csp + security headers combined) | 179856 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.10ms |
| p99 | 0.20ms |
| mean | 0.07ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.24ms |
| total | 2.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | +0.00ms | +0.54% |
| p95 | 0.10ms | 0.11ms | -0.01ms | -10.20% |
| p99 | 0.20ms | 0.20ms | +0.00ms | +0.33% |
| mean | 0.07ms | 0.07ms | +0.00ms | +0.79% |
| min | 0.04ms | 0.04ms | -0.00ms | -1.93% |
| max | 0.24ms | 0.23ms | +0.01ms | +3.70% |
| total | 2.00ms | 1.99ms | +0.02ms | +0.79% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.04% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -30.60% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -8.91% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.65% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.42% |
| max | 0.02ms | 0.03ms | -0.00ms | -3.44% |
| total | 0.22ms | 0.23ms | -0.01ms | -2.65% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.14% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.88% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +40.58% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.94% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.58% |
| max | 0.01ms | 0.00ms | +0.00ms | +45.89% |
| total | 0.06ms | 0.06ms | +0.00ms | +2.94% |

