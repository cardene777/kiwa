# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runUp | 0.0011ms | 0.0067ms | 5ms | 0.00083ms | PASS | stable (差 0.00062ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| diffSchema | 0.0010ms | 0.0021ms | 5ms | 0.00083ms | PASS | stable (差 0.00029ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| clientCreate | 0.00021ms | 0.00033ms | 5ms | 0.00083ms | PASS | stable (差 0.000042ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.02ms | 10ms | PASS |
| diffSchema | 0.03ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | -4664 B | 0 B | 102400 B | yes | PASS |
| diffSchema | -16480 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 5280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0013ms |
| p95 | 0.0067ms |
| p99 | 0.02ms |
| mean | 0.0020ms |
| stdev | 0.0031ms |
| min | 0.0011ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.00050ms | +0.00062ms | +125.00% |
| p50 | 0.0013ms | 0.00054ms | +0.00075ms | +138.38% |
| p95 | 0.0067ms | 0.0022ms | +0.0045ms | +207.30% |
| p99 | 0.02ms | 0.0068ms | +0.01ms | +148.67% |
| mean | 0.0020ms | 0.00078ms | +0.0012ms | +149.87% |
| min | 0.0011ms | 0.00042ms | +0.00067ms | +159.71% |
| max | 0.03ms | 0.0084ms | +0.02ms | +230.85% |
| total | 0.39ms | 0.16ms | +0.23ms | +149.87% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0014ms |
| p95 | 0.0021ms |
| p99 | 0.0061ms |
| mean | 0.0014ms |
| stdev | 0.00080ms |
| min | 0.0010ms |
| max | 0.0085ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0013ms | -0.00029ms | -21.83% |
| p50 | 0.0014ms | 0.0013ms | +0.000083ms | +6.22% |
| p95 | 0.0021ms | 0.0026ms | -0.00053ms | -20.29% |
| p99 | 0.0061ms | 0.01ms | -0.0067ms | -52.41% |
| mean | 0.0014ms | 0.0048ms | -0.0034ms | -70.09% |
| min | 0.0010ms | 0.0013ms | -0.00025ms | -19.36% |
| max | 0.0085ms | 0.61ms | -0.61ms | -98.61% |
| total | 0.29ms | 0.97ms | -0.68ms | -70.09% |

### clientCreate

# Perf Report — clientCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00033ms |
| p99 | 0.0015ms |
| mean | 0.00029ms |
| stdev | 0.00054ms |
| min | 0.00017ms |
| max | 0.0070ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00029ms | +0.000043ms | +14.76% |
| p99 | 0.0015ms | 0.0016ms | -0.00017ms | -10.55% |
| mean | 0.00029ms | 0.00029ms | -0.0000072ms | -2.46% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0070ms | 0.01ms | -0.0036ms | -33.86% |
| total | 0.06ms | 0.06ms | -0.0014ms | -2.46% |

