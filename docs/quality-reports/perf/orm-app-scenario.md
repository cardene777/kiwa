# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.28ms | 0.47ms | 200ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.30ms | 0.46ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.27ms | 0.40ms | 200ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | cpu | 0.08ms | 0.28ms | 3.507 | 4.947 | 0.29ms | 0.41ms |
| query_workload (100 insert + 100 select) | cpu | 0.08ms | 0.30ms | 3.727 | 4.544 | 0.31ms | 0.38ms |
| crud_cycle (10 rows × insert+update+delete) | cpu | 0.08ms | 0.27ms | 3.271 | 3.595 | 0.27ms | 0.30ms |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.98ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 1.08ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 0.83ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -54144 B | 3 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -7936 B | -3 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -35240 B | -1 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.28ms |
| p50 | 0.34ms |
| p95 | 0.47ms |
| p99 | 0.48ms |
| mean | 0.35ms |
| stdev | 0.07ms |
| min | 0.28ms |
| max | 0.48ms |
| total | 5.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.28ms | 0.41ms | -0.12ms | -30.11% |
| p50 | 0.34ms | 0.48ms | -0.14ms | -28.57% |
| p95 | 0.47ms | 0.77ms | -0.31ms | -39.71% |
| p99 | 0.48ms | 0.78ms | -0.30ms | -38.19% |
| mean | 0.35ms | 0.52ms | -0.17ms | -32.64% |
| min | 0.28ms | 0.37ms | -0.09ms | -24.39% |
| max | 0.48ms | 0.78ms | -0.29ms | -37.81% |
| total | 5.27ms | 7.82ms | -2.55ms | -32.64% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.30ms |
| p50 | 0.33ms |
| p95 | 0.46ms |
| p99 | 0.47ms |
| mean | 0.35ms |
| stdev | 0.06ms |
| min | 0.29ms |
| max | 0.48ms |
| total | 5.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.30ms | 0.38ms | -0.07ms | -19.38% |
| p50 | 0.33ms | 0.44ms | -0.10ms | -23.56% |
| p95 | 0.46ms | 0.65ms | -0.19ms | -29.13% |
| p99 | 0.47ms | 0.66ms | -0.18ms | -27.98% |
| mean | 0.35ms | 0.46ms | -0.11ms | -23.75% |
| min | 0.29ms | 0.33ms | -0.03ms | -10.30% |
| max | 0.48ms | 0.66ms | -0.18ms | -27.69% |
| total | 5.29ms | 6.93ms | -1.65ms | -23.75% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.27ms |
| p50 | 0.33ms |
| p95 | 0.40ms |
| p99 | 0.42ms |
| mean | 0.32ms |
| stdev | 0.05ms |
| min | 0.25ms |
| max | 0.42ms |
| total | 4.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.27ms | 0.30ms | -0.03ms | -11.22% |
| p50 | 0.33ms | 0.40ms | -0.06ms | -15.94% |
| p95 | 0.40ms | 0.48ms | -0.09ms | -17.73% |
| p99 | 0.42ms | 0.49ms | -0.07ms | -15.13% |
| mean | 0.32ms | 0.38ms | -0.06ms | -16.86% |
| min | 0.25ms | 0.23ms | +0.02ms | +10.59% |
| max | 0.42ms | 0.49ms | -0.07ms | -14.50% |
| total | 4.79ms | 5.77ms | -0.97ms | -16.86% |

