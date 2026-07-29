# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.03ms | 0.06ms | 200ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.22ms | 0.27ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.04ms | 0.04ms | 200ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | cpu | 0.09ms | 0.03ms | 0.355 | 0.421 | 0.03ms | 0.03ms |
| batch_upsert_1000 (chunked upsertVectors) | cpu | 0.08ms | 0.22ms | 2.651 | 2.703 | 0.21ms | 0.22ms |
| query_error_handling (5 dimension mismatch throw + catch) | cpu | 0.09ms | 0.04ms | 0.411 | 0.412 | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.17ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 0.99ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.18ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 6800 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 267328 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 1360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0021ms | -6.07% |
| p50 | 0.04ms | 0.04ms | +0.0046ms | +12.24% |
| p95 | 0.06ms | 0.07ms | -0.01ms | -15.35% |
| p99 | 0.07ms | 0.08ms | -0.0054ms | -7.04% |
| mean | 0.04ms | 0.04ms | +0.0011ms | +2.57% |
| min | 0.03ms | 0.03ms | +0.0015ms | +5.09% |
| max | 0.07ms | 0.08ms | -0.0041ms | -5.22% |
| total | 0.89ms | 0.86ms | +0.02ms | +2.57% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.22ms |
| p50 | 0.24ms |
| p95 | 0.27ms |
| p99 | 0.36ms |
| mean | 0.24ms |
| stdev | 0.04ms |
| min | 0.20ms |
| max | 0.38ms |
| total | 4.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.22ms | 0.22ms | -0.00099ms | -0.46% |
| p50 | 0.24ms | 0.22ms | +0.02ms | +7.27% |
| p95 | 0.27ms | 0.25ms | +0.02ms | +7.86% |
| p99 | 0.36ms | 0.35ms | +0.01ms | +3.05% |
| mean | 0.24ms | 0.23ms | +0.0099ms | +4.28% |
| min | 0.20ms | 0.21ms | -0.0094ms | -4.47% |
| max | 0.38ms | 0.37ms | +0.0083ms | +2.23% |
| total | 4.85ms | 4.65ms | +0.20ms | +4.28% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0029ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0027ms | +7.78% |
| p50 | 0.04ms | 0.04ms | +0.0026ms | +7.40% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -43.11% |
| p99 | 0.05ms | 0.08ms | -0.03ms | -42.31% |
| mean | 0.04ms | 0.04ms | -0.0012ms | -3.04% |
| min | 0.03ms | 0.03ms | +0.0024ms | +7.96% |
| max | 0.05ms | 0.08ms | -0.03ms | -42.12% |
| total | 0.77ms | 0.79ms | -0.02ms | -3.04% |

