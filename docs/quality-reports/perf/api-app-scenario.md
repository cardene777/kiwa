# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.02ms | 30ms | PASS | stable |
| batch_api_call (10 GET rapid) | 0.06ms | 50ms | PASS | stable |
| auth_header_workflow (10 request with x-api-key) | 0.01ms | 50ms | PASS | improved |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.09ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.16ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 553640 B | 0 B | 102400 B | PASS |
| batch_api_call (10 GET rapid) | 1233592 B | 0 B | 102400 B | PASS |
| auth_header_workflow (10 request with x-api-key) | 1230752 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -48.84% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -27.61% |
| p99 | 0.04ms | 0.04ms | -0.00ms | -4.23% |
| mean | 0.01ms | 0.02ms | -0.01ms | -37.78% |
| min | 0.01ms | 0.01ms | -0.01ms | -47.65% |
| max | 0.04ms | 0.04ms | +0.00ms | +3.33% |
| total | 0.34ms | 0.55ms | -0.21ms | -37.78% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -14.87% |
| p95 | 0.06ms | 0.03ms | +0.03ms | +125.98% |
| p99 | 0.09ms | 0.06ms | +0.03ms | +47.12% |
| mean | 0.02ms | 0.02ms | +0.00ms | +8.56% |
| min | 0.01ms | 0.01ms | -0.00ms | -11.03% |
| max | 0.09ms | 0.07ms | +0.02ms | +21.20% |
| total | 0.68ms | 0.62ms | +0.05ms | +8.56% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -32.68% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -28.56% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -21.66% |
| mean | 0.01ms | 0.01ms | -0.00ms | -31.64% |
| min | 0.01ms | 0.01ms | -0.00ms | -29.33% |
| max | 0.01ms | 0.01ms | -0.00ms | -20.76% |
| total | 0.26ms | 0.39ms | -0.12ms | -31.64% |

