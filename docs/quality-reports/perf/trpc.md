# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00071ms | 0.0026ms | 5ms | 0.00042ms | PASS | stable (差 0.00021ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00046ms | 0.00071ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| client_query | 0.00058ms | 0.0012ms | 5ms | 0.00042ms | PASS | stable (p10 +17% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.10ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -3016 B | 0 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | -15904 B | 0 B | 102400 B | yes | PASS |
| client_query | -512 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00083ms |
| p95 | 0.0026ms |
| p99 | 0.0074ms |
| mean | 0.0012ms |
| stdev | 0.0011ms |
| min | 0.00067ms |
| max | 0.0087ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00050ms | +0.00021ms | +41.80% |
| p50 | 0.00083ms | 0.00058ms | +0.00025ms | +42.88% |
| p95 | 0.0026ms | 0.0023ms | +0.00029ms | +12.50% |
| p99 | 0.0074ms | 0.0044ms | +0.0030ms | +66.81% |
| mean | 0.0012ms | 0.00081ms | +0.00041ms | +50.73% |
| min | 0.00067ms | 0.00050ms | +0.00017ms | +33.20% |
| max | 0.0087ms | 0.0065ms | +0.0023ms | +34.86% |
| total | 0.24ms | 0.16ms | +0.08ms | +50.73% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00071ms |
| p99 | 0.0028ms |
| mean | 0.00058ms |
| stdev | 0.00045ms |
| min | 0.00046ms |
| max | 0.0047ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000042ms | +10.07% |
| p50 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p95 | 0.00071ms | 0.00067ms | +0.000044ms | +6.60% |
| p99 | 0.0028ms | 0.0015ms | +0.0013ms | +92.44% |
| mean | 0.00058ms | 0.00051ms | +0.000072ms | +14.10% |
| min | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| max | 0.0047ms | 0.0047ms | 0.00ms | 0.00% |
| total | 0.12ms | 0.10ms | +0.01ms | +14.10% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0012ms |
| p99 | 0.0050ms |
| mean | 0.00077ms |
| stdev | 0.00072ms |
| min | 0.00054ms |
| max | 0.0060ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00050ms | +0.000083ms | +16.60% |
| p50 | 0.00063ms | 0.00054ms | +0.000083ms | +15.31% |
| p95 | 0.0012ms | 0.00096ms | +0.00025ms | +26.41% |
| p99 | 0.0050ms | 0.0055ms | -0.00046ms | -8.42% |
| mean | 0.00077ms | 0.00067ms | +0.00010ms | +15.00% |
| min | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| max | 0.0060ms | 0.0070ms | -0.00092ms | -13.16% |
| total | 0.15ms | 0.13ms | +0.02ms | +15.00% |

