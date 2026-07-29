# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.0073ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.01ms | 0.04ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.01ms | 0.03ms | 50ms | 0.00042ms | PASS | stable (p10 -2% (閾値未満)、 p95 +129% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | cpu | 0.08ms | 0.0073ms | 0.089 | 0.090 | 0.0073ms | 0.0074ms |
| batch_api_call (10 GET rapid) | cpu | 0.08ms | 0.01ms | 0.160 | 0.173 | 0.01ms | 0.01ms |
| auth_header_workflow (10 request with x-api-key) | cpu | 0.08ms | 0.01ms | 0.153 | 0.156 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.12ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.06ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 51192 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 2304 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | 8504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0073ms |
| p50 | 0.0077ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0093ms |
| stdev | 0.0034ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0074ms | -0.000042ms | -0.57% |
| p50 | 0.0077ms | 0.0082ms | -0.00052ms | -6.36% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -42.37% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -63.26% |
| mean | 0.0093ms | 0.01ms | -0.0035ms | -27.18% |
| min | 0.0073ms | 0.0073ms | -0.000083ms | -1.13% |
| max | 0.02ms | 0.06ms | -0.04ms | -66.69% |
| total | 0.28ms | 0.38ms | -0.10ms | -27.18% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0012ms | -8.54% |
| p50 | 0.02ms | 0.02ms | +0.0016ms | +10.38% |
| p95 | 0.04ms | 0.04ms | +0.0047ms | +12.75% |
| p99 | 0.13ms | 0.05ms | +0.09ms | +186.58% |
| mean | 0.02ms | 0.02ms | +0.0040ms | +20.01% |
| min | 0.01ms | 0.01ms | -0.00092ms | -6.69% |
| max | 0.17ms | 0.05ms | +0.12ms | +242.27% |
| total | 0.72ms | 0.60ms | +0.12ms | +20.01% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00017ms | -1.30% |
| p50 | 0.01ms | 0.01ms | +0.00019ms | +1.44% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +129.11% |
| p99 | 0.13ms | 0.01ms | +0.11ms | +798.37% |
| mean | 0.02ms | 0.01ms | +0.0073ms | +55.60% |
| min | 0.01ms | 0.01ms | -0.00017ms | -1.31% |
| max | 0.17ms | 0.01ms | +0.15ms | +1071.30% |
| total | 0.61ms | 0.39ms | +0.22ms | +55.60% |

