# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.04ms | 0.06ms | 200ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.21ms | 0.33ms | 200ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.04ms | 0.04ms | 200ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | cpu | 0.09ms | 0.09ms | 0.04ms | 0.400 | 0.422 | n/a | 20.0% | 0.04ms | 0.04ms |
| batch_upsert_1000 (chunked upsertVectors) | cpu | 0.09ms | 0.11ms | 0.21ms | 2.330 | 2.716 | n/a | 20.0% | 0.20ms | 0.24ms |
| query_error_handling (5 dimension mismatch throw + catch) | cpu | 0.09ms | 0.09ms | 0.04ms | 0.413 | 0.420 | n/a | 20.0% | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.17ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 1.13ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.18ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | -896 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 267328 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 416 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0076ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 0.87ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.957)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0019ms | -5.16% |
| p50 | 0.04ms | 0.04ms | -0.0029ms | -6.83% |
| p95 | 0.05ms | 0.05ms | +0.00095ms | +1.78% |
| p99 | 0.06ms | 0.06ms | -0.0015ms | -2.60% |
| mean | 0.04ms | 0.04ms | -0.0023ms | -5.30% |
| min | 0.03ms | 0.03ms | +0.0033ms | +10.77% |
| max | 0.06ms | 0.06ms | -0.0021ms | -3.58% |
| total | 0.84ms | 0.88ms | -0.05ms | -5.30% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.21ms |
| p50 | 0.26ms |
| p95 | 0.33ms |
| p99 | 0.44ms |
| mean | 0.26ms |
| stdev | 0.06ms |
| min | 0.21ms |
| max | 0.47ms |
| total | 5.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.966)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.24ms | -0.03ms | -14.21% |
| p50 | 0.25ms | 0.24ms | +0.01ms | +4.54% |
| p95 | 0.32ms | 0.29ms | +0.03ms | +10.30% |
| p99 | 0.43ms | 0.40ms | +0.03ms | +8.29% |
| mean | 0.25ms | 0.25ms | +0.00075ms | +0.29% |
| min | 0.20ms | 0.23ms | -0.03ms | -14.03% |
| max | 0.46ms | 0.42ms | +0.03ms | +7.95% |
| total | 5.09ms | 5.07ms | +0.01ms | +0.29% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0029ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.78ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.925)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00057ms | -1.66% |
| p50 | 0.04ms | 0.04ms | -0.00092ms | -2.45% |
| p95 | 0.04ms | 0.10ms | -0.06ms | -59.44% |
| p99 | 0.04ms | 0.19ms | -0.15ms | -78.92% |
| mean | 0.04ms | 0.05ms | -0.01ms | -27.86% |
| min | 0.03ms | 0.03ms | -0.00090ms | -2.98% |
| max | 0.04ms | 0.22ms | -0.18ms | -81.11% |
| total | 0.72ms | 1.00ms | -0.28ms | -27.86% |

