# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.01ms | 0.03ms | 30ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.02ms | 0.03ms | 50ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.01ms | 0.24ms | 50ms | 0.00042ms | PASS | stable (p10 -1% (閾値未満)、 p95 +1256% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.07ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.11ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.04ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 6208 B | -10891 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 17336 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | -28392 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0071ms | +0.0067ms | +94.09% |
| p50 | 0.01ms | 0.0076ms | +0.0064ms | +83.92% |
| p95 | 0.03ms | 0.02ms | +0.0097ms | +52.93% |
| p99 | 0.06ms | 0.04ms | +0.02ms | +52.25% |
| mean | 0.02ms | 0.01ms | +0.0063ms | +56.99% |
| min | 0.01ms | 0.0071ms | +0.0066ms | +93.53% |
| max | 0.07ms | 0.05ms | +0.02ms | +45.89% |
| total | 0.52ms | 0.33ms | +0.19ms | +56.99% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0030ms | +20.88% |
| p50 | 0.02ms | 0.02ms | +0.0031ms | +18.97% |
| p95 | 0.03ms | 0.03ms | -0.000048ms | -0.14% |
| p99 | 0.10ms | 0.04ms | +0.07ms | +187.91% |
| mean | 0.02ms | 0.02ms | +0.0044ms | +22.54% |
| min | 0.02ms | 0.01ms | +0.0032ms | +23.70% |
| max | 0.13ms | 0.04ms | +0.09ms | +255.10% |
| total | 0.71ms | 0.58ms | +0.13ms | +22.54% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.24ms |
| p99 | 0.37ms |
| mean | 0.05ms |
| stdev | 0.09ms |
| min | 0.01ms |
| max | 0.41ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00013ms | -1.26% |
| p50 | 0.01ms | 0.01ms | +0.00013ms | +1.16% |
| p95 | 0.24ms | 0.02ms | +0.22ms | +1255.73% |
| p99 | 0.37ms | 0.02ms | +0.35ms | +1718.85% |
| mean | 0.05ms | 0.01ms | +0.04ms | +308.53% |
| min | 0.01ms | 0.01ms | -0.00025ms | -2.44% |
| max | 0.41ms | 0.02ms | +0.39ms | +1844.53% |
| total | 1.42ms | 0.35ms | +1.07ms | +308.53% |

