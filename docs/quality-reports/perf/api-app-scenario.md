# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.0072ms | 0.02ms | 30ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.01ms | 0.03ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.01ms | 0.01ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | cpu | 0.08ms | 0.08ms | 0.0072ms | 0.088 | 0.092 | 0.0070ms | 0.0074ms |
| batch_api_call (10 GET rapid) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.162 | 0.160 | 0.01ms | 0.01ms |
| auth_header_workflow (10 request with x-api-key) | cpu | 0.08ms | 0.08ms | 0.01ms | 0.150 | 0.156 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.09ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.06ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -9688 B | 0 B | 102400 B | yes | PASS |
| batch_api_call (10 GET rapid) | 12648 B | 0 B | 102400 B | yes | PASS |
| auth_header_workflow (10 request with x-api-key) | 9224 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0072ms |
| p50 | 0.0077ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.0041ms |
| min | 0.0071ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0074ms | -0.00033ms | -4.49% |
| p50 | 0.0076ms | 0.0077ms | -0.00014ms | -1.76% |
| p95 | 0.02ms | 0.02ms | +0.0030ms | +18.63% |
| p99 | 0.02ms | 0.02ms | +0.0014ms | +7.40% |
| mean | 0.0097ms | 0.0093ms | +0.00044ms | +4.73% |
| min | 0.0070ms | 0.0072ms | -0.00025ms | -3.47% |
| max | 0.02ms | 0.02ms | +0.00050ms | +2.50% |
| total | 0.29ms | 0.28ms | +0.01ms | +4.73% |

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
| total | 0.68ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.008)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00020ms | +1.49% |
| p50 | 0.02ms | 0.02ms | +0.0013ms | +8.58% |
| p95 | 0.03ms | 0.04ms | -0.0055ms | -14.51% |
| p99 | 0.13ms | 0.04ms | +0.09ms | +225.04% |
| mean | 0.02ms | 0.02ms | +0.0041ms | +21.59% |
| min | 0.01ms | 0.01ms | +0.00015ms | +1.16% |
| max | 0.17ms | 0.04ms | +0.13ms | +318.36% |
| total | 0.68ms | 0.56ms | +0.12ms | +21.59% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 0.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.009)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00043ms | -3.41% |
| p50 | 0.01ms | 0.01ms | -0.00041ms | -3.20% |
| p95 | 0.01ms | 0.01ms | -0.00091ms | -6.56% |
| p99 | 0.07ms | 0.03ms | +0.04ms | +120.98% |
| mean | 0.01ms | 0.01ms | +0.0012ms | +8.98% |
| min | 0.01ms | 0.01ms | -0.00052ms | -4.16% |
| max | 0.09ms | 0.04ms | +0.05ms | +140.57% |
| total | 0.45ms | 0.41ms | +0.04ms | +8.98% |

