# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.05ms | 0.06ms | 200ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.21ms | 0.33ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.04ms | 0.16ms | 200ms | 0.00044ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | cpu | 0.09ms | 0.11ms | 0.05ms | 0.490 | 0.422 | 0.04ms | 0.04ms |
| batch_upsert_1000 (chunked upsertVectors) | cpu | 0.09ms | 0.09ms | 0.21ms | 2.404 | 2.716 | 0.21ms | 0.24ms |
| query_error_handling (5 dimension mismatch throw + catch) | cpu | 0.09ms | 0.69ms | 0.04ms | 0.407 | 0.420 | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.26ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 1.19ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.20ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 3688 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | -283336 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 1416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0070ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.933)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0059ms | +15.99% |
| p50 | 0.05ms | 0.04ms | +0.0056ms | +13.07% |
| p95 | 0.06ms | 0.05ms | +0.0055ms | +10.28% |
| p99 | 0.07ms | 0.06ms | +0.0077ms | +13.20% |
| mean | 0.05ms | 0.04ms | +0.0048ms | +10.92% |
| min | 0.04ms | 0.03ms | +0.0084ms | +27.58% |
| max | 0.07ms | 0.06ms | +0.0082ms | +13.85% |
| total | 0.98ms | 0.88ms | +0.10ms | +10.92% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.21ms |
| p50 | 0.27ms |
| p95 | 0.33ms |
| p99 | 0.42ms |
| mean | 0.26ms |
| stdev | 0.05ms |
| min | 0.21ms |
| max | 0.44ms |
| total | 5.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.976)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.21ms | 0.24ms | -0.03ms | -11.48% |
| p50 | 0.26ms | 0.24ms | +0.02ms | +7.56% |
| p95 | 0.32ms | 0.29ms | +0.04ms | +12.46% |
| p99 | 0.41ms | 0.40ms | +0.02ms | +3.80% |
| mean | 0.26ms | 0.25ms | +0.0044ms | +1.73% |
| min | 0.21ms | 0.23ms | -0.03ms | -11.88% |
| max | 0.43ms | 0.42ms | +0.0098ms | +2.32% |
| total | 5.16ms | 5.07ms | +0.09ms | +1.73% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.16ms |
| p99 | 0.23ms |
| mean | 0.06ms |
| stdev | 0.05ms |
| min | 0.03ms |
| max | 0.24ms |
| total | 1.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.878)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0011ms | -3.11% |
| p50 | 0.04ms | 0.04ms | -0.0018ms | -4.92% |
| p95 | 0.14ms | 0.10ms | +0.04ms | +42.67% |
| p99 | 0.20ms | 0.19ms | +0.0052ms | +2.66% |
| mean | 0.05ms | 0.05ms | -0.00051ms | -1.03% |
| min | 0.03ms | 0.03ms | -0.00026ms | -0.87% |
| max | 0.21ms | 0.22ms | -0.0040ms | -1.85% |
| total | 0.99ms | 1.00ms | -0.01ms | -1.03% |

