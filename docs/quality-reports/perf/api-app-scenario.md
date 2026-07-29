# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.0073ms | 0.03ms | 30ms | 0.00049ms | PASS | stable (p10 +3% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.01ms | 0.04ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.01ms | 0.02ms | 50ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.05ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.12ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.07ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -7080 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 28568 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | 4376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0073ms |
| p50 | 0.0077ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0073ms |
| min | 0.0073ms |
| max | 0.04ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0071ms | +0.00020ms | +2.86% |
| p50 | 0.0077ms | 0.0076ms | +0.000062ms | +0.81% |
| p95 | 0.03ms | 0.02ms | +0.0080ms | +43.35% |
| p99 | 0.04ms | 0.04ms | -0.0017ms | -4.48% |
| mean | 0.01ms | 0.01ms | +0.00049ms | +4.46% |
| min | 0.0073ms | 0.0071ms | +0.00017ms | +2.36% |
| max | 0.04ms | 0.05ms | -0.0075ms | -16.62% |
| total | 0.34ms | 0.33ms | +0.01ms | +4.46% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00018ms | -1.27% |
| p50 | 0.02ms | 0.02ms | +0.0022ms | +13.31% |
| p95 | 0.04ms | 0.03ms | +0.0025ms | +7.34% |
| p99 | 0.12ms | 0.04ms | +0.09ms | +245.36% |
| mean | 0.02ms | 0.02ms | +0.0048ms | +24.63% |
| min | 0.01ms | 0.01ms | +0.00025ms | +1.85% |
| max | 0.16ms | 0.04ms | +0.12ms | +336.46% |
| total | 0.72ms | 0.58ms | +0.14ms | +24.63% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0021ms | +20.56% |
| p50 | 0.01ms | 0.01ms | +0.0019ms | +18.02% |
| p95 | 0.02ms | 0.02ms | +0.0019ms | +10.92% |
| p99 | 0.11ms | 0.02ms | +0.09ms | +460.66% |
| mean | 0.02ms | 0.01ms | +0.0062ms | +53.78% |
| min | 0.01ms | 0.01ms | +0.0021ms | +20.24% |
| max | 0.15ms | 0.02ms | +0.13ms | +627.52% |
| total | 0.54ms | 0.35ms | +0.19ms | +53.78% |

