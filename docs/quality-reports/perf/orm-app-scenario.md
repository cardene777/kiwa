# Perf Suite — orm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | 0.42ms | 0.62ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_workload (100 insert + 100 select) | 0.43ms | 1.20ms | 200ms | 0.00049ms | PASS | stable (換算後 p10 +17% (閾値未満)、 p95 +165% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| crud_cycle (10 rows × insert+update+delete) | 0.34ms | 0.83ms | 200ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | cpu | 0.08ms | 0.10ms | 0.42ms | 5.101 | 4.606 | 0.42ms | 0.38ms |
| query_workload (100 insert + 100 select) | cpu | 0.08ms | 0.09ms | 0.43ms | 5.248 | 4.482 | 0.43ms | 0.36ms |
| crud_cycle (10 rows × insert+update+delete) | cpu | 0.08ms | 0.09ms | 0.34ms | 4.100 | 3.388 | 0.33ms | 0.27ms |

## Concurrent p95 (concurrency = 4, 3 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bulk_insert (setup + 100 insert) | 1.35ms | 400ms | PASS |
| query_workload (100 insert + 100 select) | 2.26ms | 400ms | PASS |
| crud_cycle (10 rows × insert+update+delete) | 1.28ms | 400ms | PASS |

## Memory retention (15 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bulk_insert (setup + 100 insert) | -53752 B | 4 B | 102400 B | yes | PASS |
| query_workload (100 insert + 100 select) | -9160 B | 0 B | 102400 B | yes | PASS |
| crud_cycle (10 rows × insert+update+delete) | -34760 B | -2 B | 102400 B | yes | PASS |

## Detailed serial reports

### bulk_insert (setup + 100 insert)

# Perf Report — bulk_insert (setup + 100 insert).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.42ms |
| p50 | 0.54ms |
| p95 | 0.62ms |
| p99 | 0.65ms |
| mean | 0.52ms |
| stdev | 0.09ms |
| min | 0.31ms |
| max | 0.66ms |
| total | 7.74ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.42ms | 0.38ms | +0.04ms | +10.74% |
| p50 | 0.53ms | 0.45ms | +0.09ms | +19.24% |
| p95 | 0.61ms | 0.61ms | +0.0011ms | +0.17% |
| p99 | 0.65ms | 0.62ms | +0.03ms | +5.45% |
| mean | 0.51ms | 0.48ms | +0.04ms | +7.51% |
| min | 0.31ms | 0.35ms | -0.04ms | -12.39% |
| max | 0.66ms | 0.62ms | +0.04ms | +6.75% |
| total | 7.70ms | 7.16ms | +0.54ms | +7.51% |

### query_workload (100 insert + 100 select)

# Perf Report — query_workload (100 insert + 100 select).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.43ms |
| p50 | 0.78ms |
| p95 | 1.20ms |
| p99 | 1.31ms |
| mean | 0.80ms |
| stdev | 0.27ms |
| min | 0.42ms |
| max | 1.34ms |
| total | 11.93ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.43ms | 0.36ms | +0.06ms | +17.11% |
| p50 | 0.77ms | 0.38ms | +0.39ms | +104.27% |
| p95 | 1.17ms | 0.44ms | +0.73ms | +165.27% |
| p99 | 1.29ms | 0.46ms | +0.83ms | +182.04% |
| mean | 0.78ms | 0.39ms | +0.39ms | +100.67% |
| min | 0.41ms | 0.33ms | +0.08ms | +24.27% |
| max | 1.32ms | 0.46ms | +0.86ms | +186.08% |
| total | 11.72ms | 5.84ms | +5.88ms | +100.67% |

### crud_cycle (10 rows × insert+update+delete)

# Perf Report — crud_cycle (10 rows × insert+update+delete).serial

| metric | value |
|---|---|
| iterations | 15 |
| warmup | 3 |
| p10 | 0.34ms |
| p50 | 0.45ms |
| p95 | 0.83ms |
| p99 | 0.88ms |
| mean | 0.49ms |
| stdev | 0.18ms |
| min | 0.30ms |
| max | 0.89ms |
| total | 7.42ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.33ms | 0.27ms | +0.06ms | +21.01% |
| p50 | 0.44ms | 0.31ms | +0.12ms | +39.21% |
| p95 | 0.82ms | 0.38ms | +0.43ms | +112.87% |
| p99 | 0.86ms | 0.40ms | +0.46ms | +115.03% |
| mean | 0.49ms | 0.32ms | +0.17ms | +52.00% |
| min | 0.29ms | 0.26ms | +0.03ms | +10.67% |
| max | 0.87ms | 0.41ms | +0.47ms | +115.54% |
| total | 7.28ms | 4.79ms | +2.49ms | +52.00% |

