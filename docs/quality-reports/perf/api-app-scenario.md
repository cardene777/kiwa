# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.02ms | 30ms | PASS | stable |
| batch_api_call (10 GET rapid) | 0.03ms | 50ms | PASS | stable |
| auth_header_workflow (10 request with x-api-key) | 0.05ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.10ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.04ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -9920 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 40504 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | -32576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +17.95% |
| p95 | 0.02ms | 0.03ms | -0.00ms | -6.62% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -10.38% |
| mean | 0.01ms | 0.01ms | +0.00ms | +13.64% |
| min | 0.01ms | 0.01ms | +0.00ms | +11.50% |
| max | 0.03ms | 0.03ms | -0.00ms | -8.01% |
| total | 0.40ms | 0.35ms | +0.05ms | +13.64% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.55ms |
| mean | 0.04ms |
| stdev | 0.13ms |
| min | 0.02ms |
| max | 0.75ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +19.04% |
| p95 | 0.03ms | 0.03ms | +0.01ms | +21.81% |
| p99 | 0.55ms | 0.03ms | +0.51ms | +1519.19% |
| mean | 0.04ms | 0.02ms | +0.03ms | +143.14% |
| min | 0.02ms | 0.01ms | +0.00ms | +7.98% |
| max | 0.75ms | 0.04ms | +0.72ms | +1996.08% |
| total | 1.33ms | 0.55ms | +0.78ms | +143.14% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.15ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -27.98% |
| p95 | 0.05ms | 0.01ms | +0.04ms | +287.92% |
| p99 | 0.15ms | 0.01ms | +0.13ms | +922.12% |
| mean | 0.02ms | 0.01ms | +0.00ms | +34.49% |
| min | 0.01ms | 0.01ms | -0.00ms | -29.18% |
| max | 0.17ms | 0.01ms | +0.16ms | +1086.59% |
| total | 0.53ms | 0.39ms | +0.14ms | +34.49% |

