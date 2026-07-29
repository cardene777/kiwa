# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.01ms | 0.03ms | 30ms | 0.00041ms | PASS | regressed — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.02ms | 1.20ms | 50ms | 0.00041ms | PASS | stable (p10 +14% (閾値未満)、 p95 +3464% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.0092ms | 0.02ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.12ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.04ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 5920 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 51640 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | -28192 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0056ms |
| min | 0.0082ms |
| max | 0.03ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0071ms | +0.0043ms | +60.17% |
| p50 | 0.01ms | 0.0076ms | +0.0072ms | +94.00% |
| p95 | 0.03ms | 0.02ms | +0.0081ms | +44.02% |
| p99 | 0.03ms | 0.04ms | -0.0047ms | -12.54% |
| mean | 0.02ms | 0.01ms | +0.0050ms | +45.13% |
| min | 0.0082ms | 0.0071ms | +0.0011ms | +15.88% |
| max | 0.03ms | 0.05ms | -0.01ms | -25.11% |
| total | 0.48ms | 0.33ms | +0.15ms | +45.13% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 1.20ms |
| p99 | 5.83ms |
| mean | 0.36ms |
| stdev | 1.40ms |
| min | 0.02ms |
| max | 7.56ms |
| total | 10.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0020ms | +14.06% |
| p50 | 0.02ms | 0.02ms | +0.0017ms | +10.05% |
| p95 | 1.20ms | 0.03ms | +1.17ms | +3463.87% |
| p99 | 5.83ms | 0.04ms | +5.80ms | +16549.92% |
| mean | 0.36ms | 0.02ms | +0.34ms | +1749.98% |
| min | 0.02ms | 0.01ms | +0.0019ms | +14.16% |
| max | 7.56ms | 0.04ms | +7.52ms | +21170.84% |
| total | 10.71ms | 0.58ms | +10.13ms | +1749.98% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0092ms |
| p50 | 0.0094ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0091ms |
| max | 0.12ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.01ms | -0.0012ms | -11.29% |
| p50 | 0.0094ms | 0.01ms | -0.0013ms | -12.40% |
| p95 | 0.02ms | 0.02ms | +0.000054ms | +0.30% |
| p99 | 0.09ms | 0.02ms | +0.07ms | +354.21% |
| mean | 0.01ms | 0.01ms | +0.0022ms | +18.89% |
| min | 0.0091ms | 0.01ms | -0.0012ms | -11.34% |
| max | 0.12ms | 0.02ms | +0.10ms | +484.94% |
| total | 0.41ms | 0.35ms | +0.07ms | +18.89% |

