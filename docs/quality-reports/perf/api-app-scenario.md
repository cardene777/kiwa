# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.01ms | 0.02ms | 30ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.02ms | 0.04ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.01ms | 0.02ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.06ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 7.08ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.06ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 20584 B | -10879 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | -21672 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | 4712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0037ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0071ms | +0.0068ms | +95.84% |
| p50 | 0.01ms | 0.0076ms | +0.0066ms | +85.83% |
| p95 | 0.02ms | 0.02ms | +0.0013ms | +7.06% |
| p99 | 0.03ms | 0.04ms | -0.0084ms | -22.46% |
| mean | 0.02ms | 0.01ms | +0.0046ms | +41.65% |
| min | 0.01ms | 0.0071ms | +0.0068ms | +95.89% |
| max | 0.03ms | 0.05ms | -0.01ms | -27.42% |
| total | 0.47ms | 0.33ms | +0.14ms | +41.65% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0016ms | +11.43% |
| p50 | 0.02ms | 0.02ms | +0.00035ms | +2.13% |
| p95 | 0.04ms | 0.03ms | +0.0040ms | +11.77% |
| p99 | 0.10ms | 0.04ms | +0.07ms | +189.24% |
| mean | 0.02ms | 0.02ms | +0.0036ms | +18.67% |
| min | 0.02ms | 0.01ms | +0.0021ms | +15.39% |
| max | 0.13ms | 0.04ms | +0.09ms | +252.64% |
| total | 0.69ms | 0.58ms | +0.11ms | +18.67% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0023ms | +22.13% |
| p50 | 0.01ms | 0.01ms | +0.0023ms | +21.13% |
| p95 | 0.02ms | 0.02ms | -0.00057ms | -3.23% |
| p99 | 0.09ms | 0.02ms | +0.07ms | +341.35% |
| mean | 0.02ms | 0.01ms | +0.0052ms | +44.66% |
| min | 0.01ms | 0.01ms | +0.0022ms | +21.86% |
| max | 0.12ms | 0.02ms | +0.10ms | +468.11% |
| total | 0.50ms | 0.35ms | +0.16ms | +44.66% |

