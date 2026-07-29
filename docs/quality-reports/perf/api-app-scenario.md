# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.0071ms | 0.03ms | 30ms | 0.00042ms | PASS | stable (p10 -1% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.01ms | 0.03ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.0097ms | 0.02ms | 50ms | 0.00042ms | PASS | stable (p10 -6% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.09ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.04ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -8432 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 2120 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | -17544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0071ms |
| p50 | 0.0076ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0069ms |
| min | 0.0070ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0071ms | -0.000042ms | -0.59% |
| p50 | 0.0076ms | 0.0076ms | -0.000084ms | -1.09% |
| p95 | 0.03ms | 0.02ms | +0.0083ms | +45.21% |
| p99 | 0.03ms | 0.04ms | -0.0049ms | -13.15% |
| mean | 0.01ms | 0.01ms | +0.000069ms | +0.63% |
| min | 0.0070ms | 0.0071ms | -0.000083ms | -1.17% |
| max | 0.03ms | 0.05ms | -0.01ms | -27.79% |
| total | 0.33ms | 0.33ms | +0.0021ms | +0.63% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000037ms | +0.26% |
| p50 | 0.02ms | 0.02ms | +0.0019ms | +11.56% |
| p95 | 0.03ms | 0.03ms | -0.0020ms | -5.94% |
| p99 | 0.13ms | 0.04ms | +0.09ms | +263.98% |
| mean | 0.02ms | 0.02ms | +0.0049ms | +25.54% |
| min | 0.01ms | 0.01ms | -0.000041ms | -0.30% |
| max | 0.17ms | 0.04ms | +0.13ms | +365.65% |
| total | 0.73ms | 0.58ms | +0.15ms | +25.54% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.0097ms |
| max | 0.15ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.01ms | -0.00059ms | -5.69% |
| p50 | 0.01ms | 0.01ms | -0.00050ms | -4.65% |
| p95 | 0.02ms | 0.02ms | +0.0057ms | +32.36% |
| p99 | 0.11ms | 0.02ms | +0.09ms | +449.57% |
| mean | 0.02ms | 0.01ms | +0.0040ms | +34.76% |
| min | 0.0097ms | 0.01ms | -0.00063ms | -6.07% |
| max | 0.15ms | 0.02ms | +0.13ms | +603.16% |
| total | 0.47ms | 0.35ms | +0.12ms | +34.76% |

