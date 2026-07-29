# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.0070ms | 0.03ms | 30ms | 0.00042ms | PASS | stable (p10 -1% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.01ms | 0.03ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.01ms | 0.02ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.08ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.06ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -5856 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 5056 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | 3720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0070ms |
| p50 | 0.0073ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0061ms |
| min | 0.0070ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0071ms | -0.000084ms | -1.18% |
| p50 | 0.0073ms | 0.0076ms | -0.00035ms | -4.64% |
| p95 | 0.03ms | 0.02ms | +0.0069ms | +37.73% |
| p99 | 0.03ms | 0.04ms | -0.0094ms | -25.19% |
| mean | 0.01ms | 0.01ms | -0.000090ms | -0.82% |
| min | 0.0070ms | 0.0071ms | -0.00013ms | -1.76% |
| max | 0.03ms | 0.05ms | -0.02ms | -37.40% |
| total | 0.33ms | 0.33ms | -0.0027ms | -0.82% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00018ms | +1.29% |
| p50 | 0.02ms | 0.02ms | +0.0027ms | +16.46% |
| p95 | 0.03ms | 0.03ms | -0.0015ms | -4.53% |
| p99 | 0.10ms | 0.04ms | +0.06ms | +172.64% |
| mean | 0.02ms | 0.02ms | +0.0033ms | +17.33% |
| min | 0.01ms | 0.01ms | +0.0000010ms | +0.01% |
| max | 0.12ms | 0.04ms | +0.09ms | +240.56% |
| total | 0.68ms | 0.58ms | +0.10ms | +17.33% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0017ms | +16.48% |
| p50 | 0.01ms | 0.01ms | +0.0015ms | +13.95% |
| p95 | 0.02ms | 0.02ms | -0.0020ms | -11.30% |
| p99 | 0.10ms | 0.02ms | +0.08ms | +401.44% |
| mean | 0.02ms | 0.01ms | +0.0051ms | +44.27% |
| min | 0.01ms | 0.01ms | +0.0016ms | +15.78% |
| max | 0.14ms | 0.02ms | +0.12ms | +556.62% |
| total | 0.50ms | 0.35ms | +0.15ms | +44.27% |

