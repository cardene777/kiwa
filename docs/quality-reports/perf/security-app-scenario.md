# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.15ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +188%) 以上の悪化が必要) |
| security_headers_validate_loop (20 build + validate) | 0.03ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +4476%) 以上の悪化が必要) |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +6447%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.46ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.02ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -10216 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | 3096 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | 696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.07ms |
| p95 | 0.15ms |
| p99 | 0.46ms |
| mean | 0.10ms |
| stdev | 0.10ms |
| min | 0.06ms |
| max | 0.59ms |
| total | 2.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.06ms | +0.01ms | +20.63% |
| p95 | 0.15ms | 0.27ms | -0.12ms | -44.28% |
| p99 | 0.46ms | 0.34ms | +0.13ms | +38.36% |
| mean | 0.10ms | 0.11ms | -0.02ms | -14.43% |
| min | 0.06ms | 0.04ms | +0.01ms | +32.58% |
| max | 0.59ms | 0.35ms | +0.24ms | +67.08% |
| total | 2.95ms | 3.44ms | -0.50ms | -14.43% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.11ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.91% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +148.92% |
| p99 | 0.09ms | 0.02ms | +0.07ms | +312.49% |
| mean | 0.01ms | 0.01ms | +0.00ms | +51.65% |
| min | 0.00ms | 0.01ms | -0.00ms | -31.05% |
| max | 0.11ms | 0.03ms | +0.08ms | +336.63% |
| total | 0.36ms | 0.24ms | +0.12ms | +51.65% |

### production_hardening_flow (csp + security headers combined)

# Perf Report — production_hardening_flow (csp + security headers combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -49.04% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -29.69% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -29.27% |
| mean | 0.00ms | 0.01ms | -0.00ms | -44.32% |
| min | 0.00ms | 0.00ms | -0.00ms | -59.01% |
| max | 0.01ms | 0.01ms | -0.00ms | -30.79% |
| total | 0.09ms | 0.15ms | -0.07ms | -44.32% |

