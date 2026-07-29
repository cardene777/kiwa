# Perf Suite — trpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeProcedure_query | 0.00050ms | 0.0030ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeProcedure_mutation | 0.00042ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| client_query | 0.00050ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeProcedure_query | 0.02ms | 10ms | PASS |
| invokeProcedure_mutation | 0.01ms | 10ms | PASS |
| client_query | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeProcedure_query | -7128 B | -48009 B | 102400 B | yes | PASS |
| invokeProcedure_mutation | -15184 B | 0 B | 102400 B | yes | PASS |
| client_query | -312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeProcedure_query

# Perf Report — invokeProcedure_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00063ms |
| p95 | 0.0030ms |
| p99 | 0.0093ms |
| mean | 0.0012ms |
| stdev | 0.0031ms |
| min | 0.00050ms |
| max | 0.04ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00063ms | 0.00058ms | +0.000042ms | +7.20% |
| p95 | 0.0030ms | 0.0023ms | +0.00063ms | +26.81% |
| p99 | 0.0093ms | 0.0044ms | +0.0048ms | +109.50% |
| mean | 0.0012ms | 0.00081ms | +0.00035ms | +43.84% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.04ms | 0.0065ms | +0.04ms | +550.99% |
| total | 0.23ms | 0.16ms | +0.07ms | +43.84% |

### invokeProcedure_mutation

# Perf Report — invokeProcedure_mutation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00067ms |
| p99 | 0.0023ms |
| mean | 0.00053ms |
| stdev | 0.00042ms |
| min | 0.00042ms |
| max | 0.0046ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00046ms | +0.0000010ms | +0.22% |
| p95 | 0.00067ms | 0.00067ms | -9.5e-7ms | -0.14% |
| p99 | 0.0023ms | 0.0015ms | +0.00085ms | +58.18% |
| mean | 0.00053ms | 0.00051ms | +0.000019ms | +3.70% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0046ms | 0.0047ms | -0.00013ms | -2.63% |
| total | 0.11ms | 0.10ms | +0.0038ms | +3.70% |

### client_query

# Perf Report — client_query.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0010ms |
| p99 | 0.0063ms |
| mean | 0.00073ms |
| stdev | 0.00094ms |
| min | 0.00046ms |
| max | 0.0077ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0010ms | 0.00096ms | +0.000090ms | +9.42% |
| p99 | 0.0063ms | 0.0055ms | +0.00078ms | +14.36% |
| mean | 0.00073ms | 0.00067ms | +0.000062ms | +9.29% |
| min | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| max | 0.0077ms | 0.0070ms | +0.00071ms | +10.18% |
| total | 0.15ms | 0.13ms | +0.01ms | +9.29% |

