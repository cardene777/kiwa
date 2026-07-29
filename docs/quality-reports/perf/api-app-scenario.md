# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.0074ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.02ms | 0.05ms | 50ms | 0.00042ms | PASS | stable (p10 +14% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.0099ms | 0.02ms | 50ms | 0.00042ms | PASS | stable (p10 -5% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.08ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.13ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.04ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -11200 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 30152 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | -29784 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0074ms |
| p50 | 0.0086ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0086ms |
| min | 0.0073ms |
| max | 0.05ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0071ms | +0.00025ms | +3.51% |
| p50 | 0.0086ms | 0.0076ms | +0.00098ms | +12.80% |
| p95 | 0.02ms | 0.02ms | +0.0029ms | +16.03% |
| p99 | 0.04ms | 0.04ms | +0.0051ms | +13.64% |
| mean | 0.01ms | 0.01ms | +0.00073ms | +6.64% |
| min | 0.0073ms | 0.0071ms | +0.00025ms | +3.53% |
| max | 0.05ms | 0.05ms | +0.0056ms | +12.37% |
| total | 0.35ms | 0.33ms | +0.02ms | +6.64% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.21ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.27ms |
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0020ms | +14.11% |
| p50 | 0.02ms | 0.02ms | +0.0050ms | +30.03% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +50.83% |
| p99 | 0.21ms | 0.04ms | +0.18ms | +502.23% |
| mean | 0.03ms | 0.02ms | +0.01ms | +64.83% |
| min | 0.02ms | 0.01ms | +0.0023ms | +17.24% |
| max | 0.27ms | 0.04ms | +0.24ms | +671.51% |
| total | 0.95ms | 0.58ms | +0.38ms | +64.83% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0096ms |
| max | 0.14ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.01ms | -0.00047ms | -4.52% |
| p50 | 0.01ms | 0.01ms | -0.00056ms | -5.23% |
| p95 | 0.02ms | 0.02ms | +0.0045ms | +25.44% |
| p99 | 0.10ms | 0.02ms | +0.08ms | +406.84% |
| mean | 0.02ms | 0.01ms | +0.0036ms | +31.29% |
| min | 0.0096ms | 0.01ms | -0.00067ms | -6.48% |
| max | 0.14ms | 0.02ms | +0.12ms | +550.68% |
| total | 0.46ms | 0.35ms | +0.11ms | +31.29% |

