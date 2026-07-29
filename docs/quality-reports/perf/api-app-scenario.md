# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.02ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +2442%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.09ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +2117%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.02ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +1971%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.07ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.12ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 1.77ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -10264 B | -10824 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | -18224 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +47.30% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +14.03% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +20.66% |
| mean | 0.02ms | 0.01ms | +0.00ms | +36.31% |
| min | 0.01ms | 0.01ms | +0.00ms | +44.17% |
| max | 0.04ms | 0.03ms | +0.01ms | +22.74% |
| total | 0.51ms | 0.38ms | +0.14ms | +36.31% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.09ms |
| p99 | 1.10ms |
| mean | 0.07ms |
| stdev | 0.27ms |
| min | 0.02ms |
| max | 1.49ms |
| total | 2.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +11.08% |
| p95 | 0.09ms | 0.02ms | +0.07ms | +286.98% |
| p99 | 1.10ms | 0.05ms | +1.04ms | +1901.97% |
| mean | 0.07ms | 0.02ms | +0.05ms | +262.87% |
| min | 0.02ms | 0.02ms | -0.00ms | -9.25% |
| max | 1.49ms | 0.07ms | +1.43ms | +2111.17% |
| total | 2.19ms | 0.60ms | +1.59ms | +262.87% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +22.95% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -38.27% |
| p99 | 0.09ms | 0.04ms | +0.05ms | +139.70% |
| mean | 0.02ms | 0.01ms | +0.00ms | +32.04% |
| min | 0.01ms | 0.01ms | +0.00ms | +50.69% |
| max | 0.12ms | 0.04ms | +0.08ms | +185.33% |
| total | 0.54ms | 0.41ms | +0.13ms | +32.04% |

