# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.09ms | 30ms | PASS | stable |
| security_headers_validate_loop (20 build + validate) | 0.03ms | 50ms | PASS | stable |
| production_hardening_flow (csp + security headers combined) | 0.00ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.49ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.02ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -4056 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | -144 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | -544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.09ms |
| p99 | 0.24ms |
| mean | 0.07ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.31ms |
| total | 2.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | -0.00ms | -2.67% |
| p95 | 0.09ms | 0.09ms | -0.00ms | -1.64% |
| p99 | 0.24ms | 0.21ms | +0.04ms | +18.79% |
| mean | 0.07ms | 0.07ms | +0.00ms | +2.86% |
| min | 0.04ms | 0.04ms | -0.00ms | -2.66% |
| max | 0.31ms | 0.25ms | +0.06ms | +22.65% |
| total | 2.08ms | 2.02ms | +0.06ms | +2.86% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +8.30% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +70.13% |
| p99 | 0.10ms | 0.02ms | +0.07ms | +304.94% |
| mean | 0.01ms | 0.01ms | +0.00ms | +53.16% |
| min | 0.01ms | 0.00ms | +0.00ms | +33.67% |
| max | 0.12ms | 0.03ms | +0.10ms | +346.40% |
| total | 0.35ms | 0.23ms | +0.12ms | +53.16% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +82.37% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +87.97% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.06% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.52% |
| max | 0.01ms | 0.00ms | +0.00ms | +81.33% |
| total | 0.07ms | 0.06ms | +0.01ms | +10.06% |

