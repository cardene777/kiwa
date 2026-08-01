# Perf Suite — api-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00050ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0010ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.0085ms | 0.14ms | 30ms | 0.00086ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +646% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| batch_api_call (10 GET rapid) | 0.02ms | 0.04ms | 50ms | 0.00088ms | PASS | stable — gate 無効 (regressionGate=false) |
| auth_header_workflow (10 request with x-api-key) | 0.01ms | 0.01ms | 50ms | 0.00087ms | PASS | improved — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | cpu | 0.09ms | 0.18ms | 0.0085ms | 0.091 | 0.092 | n/a | 20.0% | 0.0073ms | 0.0074ms |
| batch_api_call (10 GET rapid) | cpu | 0.09ms | 0.10ms | 0.02ms | 0.169 | 0.160 | n/a | 20.0% | 0.01ms | 0.01ms |
| auth_header_workflow (10 request with x-api-key) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.124 | 0.156 | n/a | 20.0% | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | 0.04ms | 60ms | PASS |
| batch_api_call (10 GET rapid) | 0.09ms | 100ms | PASS |
| auth_header_workflow (10 request with x-api-key) | 0.05ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| rest_crud_flow (POST create + GET fetch + PUT update + DELETE) | -13720 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| batch_api_call (10 GET rapid) | 3176 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| auth_header_workflow (10 request with x-api-key) | -18000 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### rest_crud_flow (POST create + GET fetch + PUT update + DELETE)

# Perf Report — rest_crud_flow (POST create + GET fetch + PUT update + DELETE).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0085ms |
| p50 | 0.01ms |
| p95 | 0.14ms |
| p99 | 0.16ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.0083ms |
| max | 0.17ms |
| total | 1.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.857)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0074ms | -0.000092ms | -1.25% |
| p50 | 0.01ms | 0.0077ms | +0.0031ms | +40.93% |
| p95 | 0.12ms | 0.02ms | +0.10ms | +645.70% |
| p99 | 0.14ms | 0.02ms | +0.12ms | +633.03% |
| mean | 0.03ms | 0.0093ms | +0.02ms | +221.99% |
| min | 0.0071ms | 0.0072ms | -0.00014ms | -1.94% |
| max | 0.15ms | 0.02ms | +0.13ms | +622.80% |
| total | 0.90ms | 0.28ms | +0.62ms | +221.99% |

### batch_api_call (10 GET rapid)

# Perf Report — batch_api_call (10 GET rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.41ms |
| mean | 0.04ms |
| stdev | 0.10ms |
| min | 0.01ms |
| max | 0.55ms |
| total | 1.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.877)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00073ms | +5.57% |
| p50 | 0.02ms | 0.02ms | +0.00020ms | +1.31% |
| p95 | 0.04ms | 0.04ms | -0.0018ms | -4.67% |
| p99 | 0.36ms | 0.04ms | +0.32ms | +794.63% |
| mean | 0.03ms | 0.02ms | +0.01ms | +77.14% |
| min | 0.01ms | 0.01ms | -0.000039ms | -0.30% |
| max | 0.49ms | 0.04ms | +0.45ms | +1118.27% |
| total | 1.00ms | 0.56ms | +0.43ms | +77.14% |

### auth_header_workflow (10 request with x-api-key)

# Perf Report — auth_header_workflow (10 request with x-api-key).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 0.50ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.868)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0025ms | -20.09% |
| p50 | 0.01ms | 0.01ms | -0.0026ms | -20.23% |
| p95 | 0.01ms | 0.01ms | -0.0027ms | -19.15% |
| p99 | 0.10ms | 0.03ms | +0.06ms | +213.48% |
| mean | 0.01ms | 0.01ms | +0.00056ms | +4.06% |
| min | 0.0099ms | 0.01ms | -0.0026ms | -20.44% |
| max | 0.13ms | 0.04ms | +0.09ms | +249.11% |
| total | 0.43ms | 0.41ms | +0.02ms | +4.06% |

