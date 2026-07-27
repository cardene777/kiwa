# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.03ms | 30ms | PASS | stable |
| batch_api_call (10 GET rapid) | 0.03ms | 50ms | PASS | stable |
| auth_header_workflow (10 request with x-api-key) | 0.01ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.10ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.09ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -9976 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 203488 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | -31528 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.79% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +1.11% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +16.11% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.63% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.14% |
| max | 0.04ms | 0.03ms | +0.01ms | +21.32% |
| total | 0.35ms | 0.35ms | -0.01ms | -1.63% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.14ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.18ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | 0.00ms | 0.00% |
| p95 | 0.03ms | 0.03ms | +0.01ms | +19.36% |
| p99 | 0.14ms | 0.03ms | +0.10ms | +302.62% |
| mean | 0.02ms | 0.02ms | +0.01ms | +31.35% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.66% |
| max | 0.18ms | 0.04ms | +0.14ms | +392.82% |
| total | 0.72ms | 0.55ms | +0.17ms | +31.35% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.08ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -22.99% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -19.74% |
| p99 | 0.06ms | 0.01ms | +0.05ms | +326.22% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.07% |
| min | 0.01ms | 0.01ms | -0.00ms | -24.27% |
| max | 0.08ms | 0.01ms | +0.07ms | +458.30% |
| total | 0.37ms | 0.39ms | -0.02ms | -5.07% |

