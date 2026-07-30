# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 3.86ms | 65.04ms | 300ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.42ms | 1.76ms | 300ms | 0.00043ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +169% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.82ms | 19.20ms | 300ms | 0.00048ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | cpu | 0.08ms | 1.80ms | 3.86ms | 46.223 | 19.972 | 3.84ms | 1.66ms |
| concurrent_read_batch (5 GET via Promise.all) | cpu | 0.09ms | 0.11ms | 0.42ms | 4.515 | 4.418 | 0.37ms | 0.36ms |
| server_error_handling (5 GET /fail 500 responses) | cpu | 0.08ms | 0.09ms | 0.82ms | 9.721 | 4.773 | 0.79ms | 0.39ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 138.23ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 2.02ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 14.70ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 11896 B | -4202 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -5024 B | 30000 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -3984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 3.86ms |
| p50 | 10.23ms |
| p95 | 65.04ms |
| p99 | 91.58ms |
| mean | 20.88ms |
| stdev | 23.77ms |
| min | 2.50ms |
| max | 101.47ms |
| total | 626.44ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.84ms | 1.66ms | +2.18ms | +131.44% |
| p50 | 10.18ms | 2.32ms | +7.86ms | +338.27% |
| p95 | 64.73ms | 3.15ms | +61.58ms | +1954.52% |
| p99 | 91.15ms | 4.50ms | +86.65ms | +1926.67% |
| mean | 20.78ms | 2.37ms | +18.41ms | +776.64% |
| min | 2.48ms | 1.39ms | +1.09ms | +78.64% |
| max | 100.99ms | 5.01ms | +95.98ms | +1916.47% |
| total | 623.46ms | 71.12ms | +552.34ms | +776.64% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.42ms |
| p50 | 0.46ms |
| p95 | 1.76ms |
| p99 | 40.35ms |
| mean | 2.45ms |
| stdev | 10.13ms |
| min | 0.41ms |
| max | 56.02ms |
| total | 73.40ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.870)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.37ms | 0.36ms | +0.0078ms | +2.19% |
| p50 | 0.40ms | 0.39ms | +0.01ms | +2.96% |
| p95 | 1.53ms | 0.57ms | +0.96ms | +169.45% |
| p99 | 35.10ms | 0.88ms | +34.22ms | +3874.60% |
| mean | 2.13ms | 0.43ms | +1.70ms | +393.86% |
| min | 0.36ms | 0.34ms | +0.02ms | +6.77% |
| max | 48.73ms | 1.01ms | +47.73ms | +4746.81% |
| total | 63.85ms | 12.93ms | +50.92ms | +393.86% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.82ms |
| p50 | 3.38ms |
| p95 | 19.20ms |
| p99 | 20.57ms |
| mean | 6.37ms |
| stdev | 6.22ms |
| min | 0.60ms |
| max | 20.73ms |
| total | 191.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.967)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.79ms | 0.39ms | +0.40ms | +103.66% |
| p50 | 3.27ms | 0.50ms | +2.77ms | +553.46% |
| p95 | 18.58ms | 0.71ms | +17.87ms | +2531.14% |
| p99 | 19.90ms | 0.71ms | +19.18ms | +2687.09% |
| mean | 6.16ms | 0.52ms | +5.64ms | +1086.11% |
| min | 0.58ms | 0.38ms | +0.20ms | +53.81% |
| max | 20.05ms | 0.72ms | +19.33ms | +2701.45% |
| total | 184.87ms | 15.59ms | +169.29ms | +1086.11% |

