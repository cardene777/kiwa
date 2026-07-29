# Perf Suite — security-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.21ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +188%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| security_headers_validate_loop (20 build + validate) | 0.03ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +4476%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +6447%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | 0.44ms | 60ms | PASS |
| security_headers_validate_loop (20 build + validate) | 0.02ms | 100ms | PASS |
| production_hardening_flow (csp + security headers combined) | 0.01ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| csp_build_burst (50 buildCspHeader) | -7216 B | 0 B | 102400 B | yes | PASS |
| security_headers_validate_loop (20 build + validate) | 280 B | 0 B | 102400 B | yes | PASS |
| production_hardening_flow (csp + security headers combined) | -15136 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### csp_build_burst (50 buildCspHeader)

# Perf Report — csp_build_burst (50 buildCspHeader).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.06ms |
| p95 | 0.21ms |
| p99 | 0.35ms |
| mean | 0.08ms |
| stdev | 0.07ms |
| min | 0.04ms |
| max | 0.37ms |
| total | 2.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | +0.00ms | +0.31% |
| p95 | 0.21ms | 0.27ms | -0.06ms | -21.27% |
| p99 | 0.35ms | 0.34ms | +0.01ms | +4.18% |
| mean | 0.08ms | 0.11ms | -0.03ms | -26.76% |
| min | 0.04ms | 0.04ms | +0.00ms | +0.59% |
| max | 0.37ms | 0.35ms | +0.02ms | +4.66% |
| total | 2.52ms | 3.44ms | -0.92ms | -26.76% |

### security_headers_validate_loop (20 build + validate)

# Perf Report — security_headers_validate_loop (20 build + validate).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.13ms |
| mean | 0.01ms |
| stdev | 0.03ms |
| min | 0.00ms |
| max | 0.17ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.30% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +205.29% |
| p99 | 0.13ms | 0.02ms | +0.11ms | +506.00% |
| mean | 0.01ms | 0.01ms | +0.01ms | +87.37% |
| min | 0.00ms | 0.01ms | -0.00ms | -27.95% |
| max | 0.17ms | 0.03ms | +0.14ms | +564.19% |
| total | 0.44ms | 0.24ms | +0.21ms | +87.37% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -58.17% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -27.23% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -14.90% |
| mean | 0.00ms | 0.01ms | -0.00ms | -50.37% |
| min | 0.00ms | 0.00ms | -0.00ms | -59.01% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.85% |
| total | 0.08ms | 0.15ms | -0.08ms | -50.37% |

