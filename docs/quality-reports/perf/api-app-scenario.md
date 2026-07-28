# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.03ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +2442%) 以上の悪化が必要) |
| batch_api_call (10 GET rapid) | 0.04ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +2117%) 以上の悪化が必要) |
| auth_header_workflow (10 request with x-api-key) | 0.02ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +1971%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.11ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.06ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -9056 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 3560 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | -12688 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.83% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +32.80% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +22.52% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.22% |
| min | 0.01ms | 0.01ms | -0.00ms | -26.25% |
| max | 0.04ms | 0.03ms | +0.00ms | +13.91% |
| total | 0.36ms | 0.38ms | -0.02ms | -5.22% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +7.95% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +48.45% |
| p99 | 0.11ms | 0.05ms | +0.06ms | +102.29% |
| mean | 0.02ms | 0.02ms | +0.00ms | +16.56% |
| min | 0.01ms | 0.02ms | -0.00ms | -20.00% |
| max | 0.14ms | 0.07ms | +0.07ms | +109.94% |
| total | 0.70ms | 0.60ms | +0.10ms | +16.56% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.86% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -32.61% |
| p99 | 0.11ms | 0.04ms | +0.07ms | +178.77% |
| mean | 0.02ms | 0.01ms | +0.00ms | +28.19% |
| min | 0.01ms | 0.01ms | +0.00ms | +37.79% |
| max | 0.14ms | 0.04ms | +0.10ms | +230.88% |
| total | 0.53ms | 0.41ms | +0.12ms | +28.19% |

