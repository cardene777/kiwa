# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00046ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00046ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (p10 +9% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| client_query | 0.00050ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeProcedure_query | cpu | 0.08ms | 0.00046ms | 0.006 | 0.005 | 0.00046ms | 0.00042ms |
| invokeProcedure_mutation | cpu | 0.08ms | 0.00046ms | 0.006 | 0.005 | 0.00045ms | 0.00042ms |
| client_query | cpu | 0.08ms | 0.00050ms | 0.006 | 0.006 | 0.00049ms | 0.00050ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.02ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -1656 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | -15008 B | 0 B | 102400 B | yes | PASS |
| client_query | 2680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0017ms |
| p99 | 0.0081ms |
| mean | 0.00077ms |
| stdev | 0.0012ms |
| min | 0.00042ms |
| max | 0.0088ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p50 | 0.00050ms | 0.00046ms | +0.000041ms | +8.93% |
| p95 | 0.0017ms | 0.0026ms | -0.00088ms | -34.35% |
| p99 | 0.0081ms | 0.0086ms | -0.00054ms | -6.28% |
| mean | 0.00077ms | 0.00086ms | -0.000085ms | -9.95% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0088ms | 0.0093ms | -0.00054ms | -5.80% |
| total | 0.15ms | 0.17ms | -0.02ms | -9.95% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.0013ms |
| p99 | 0.0040ms |
| mean | 0.00064ms |
| stdev | 0.00074ms |
| min | 0.00042ms |
| max | 0.0078ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p50 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.0010ms | +0.00028ms | +27.98% |
| p99 | 0.0040ms | 0.0023ms | +0.0017ms | +73.11% |
| mean | 0.00064ms | 0.00061ms | +0.000031ms | +5.11% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.0078ms | 0.01ms | -0.0067ms | -46.26% |
| total | 0.13ms | 0.12ms | +0.0062ms | +5.11% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0018ms |
| p99 | 0.0062ms |
| mean | 0.00083ms |
| stdev | 0.0014ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0018ms | 0.0024ms | -0.00067ms | -27.43% |
| p99 | 0.0062ms | 0.01ms | -0.0065ms | -51.15% |
| mean | 0.00083ms | 0.0013ms | -0.00045ms | -35.36% |
| min | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| max | 0.02ms | 0.07ms | -0.05ms | -77.69% |
| total | 0.17ms | 0.26ms | -0.09ms | -35.36% |

