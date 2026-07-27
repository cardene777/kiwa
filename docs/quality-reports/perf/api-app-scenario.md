# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.17ms | 30ms | PASS | stable |
| batch_api_call (10 GET rapid) | 0.19ms | 50ms | PASS | stable |
| auth_header_workflow (10 request with x-api-key) | 0.17ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.26ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.33ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.19ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -6736 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | -24272 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | 4896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.17ms |
| p99 | 0.28ms |
| mean | 0.05ms |
| stdev | 0.06ms |
| min | 0.02ms |
| max | 0.31ms |
| total | 1.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.01ms | +0.02ms | +212.82% |
| p95 | 0.17ms | 0.03ms | +0.15ms | +577.01% |
| p99 | 0.28ms | 0.03ms | +0.25ms | +785.13% |
| mean | 0.05ms | 0.01ms | +0.04ms | +317.75% |
| min | 0.02ms | 0.01ms | +0.01ms | +202.87% |
| max | 0.31ms | 0.03ms | +0.28ms | +856.33% |
| total | 1.48ms | 0.35ms | +1.13ms | +317.75% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.06ms |
| p95 | 0.19ms |
| p99 | 0.23ms |
| mean | 0.07ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.23ms |
| total | 2.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.02ms | +0.04ms | +243.00% |
| p95 | 0.19ms | 0.03ms | +0.16ms | +598.63% |
| p99 | 0.23ms | 0.03ms | +0.20ms | +579.39% |
| mean | 0.07ms | 0.02ms | +0.05ms | +296.30% |
| min | 0.02ms | 0.01ms | +0.01ms | +52.36% |
| max | 0.23ms | 0.04ms | +0.20ms | +551.69% |
| total | 2.17ms | 0.55ms | +1.62ms | +296.30% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.17ms |
| p99 | 0.19ms |
| mean | 0.07ms |
| stdev | 0.05ms |
| min | 0.01ms |
| max | 0.19ms |
| total | 1.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.01ms | +0.03ms | +244.19% |
| p95 | 0.17ms | 0.01ms | +0.16ms | +1189.98% |
| p99 | 0.19ms | 0.01ms | +0.18ms | +1239.82% |
| mean | 0.07ms | 0.01ms | +0.05ms | +400.29% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.99% |
| max | 0.19ms | 0.01ms | +0.18ms | +1235.18% |
| total | 1.96ms | 0.39ms | +1.57ms | +400.29% |

