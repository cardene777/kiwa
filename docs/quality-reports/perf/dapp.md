# Perf Suite — dapp

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| eventEmitterEmit | 0.00025ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| anvilKeyLookup | 0.00017ms | 0.00052ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| eventEmitterEmit | 0.09ms | 10ms | PASS |
| anvilKeyLookup | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| eventEmitterEmit | -41568 B | 0 B | 102400 B | yes | PASS |
| anvilKeyLookup | -3224 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### eventEmitterEmit

# Perf Report — eventEmitterEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00038ms |
| p99 | 0.0015ms |
| mean | 0.00035ms |
| stdev | 0.00060ms |
| min | 0.00025ms |
| max | 0.0079ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00054ms | -0.00029ms | -53.79% |
| p50 | 0.00029ms | 0.00063ms | -0.00033ms | -53.44% |
| p95 | 0.00038ms | 0.00084ms | -0.00046ms | -55.15% |
| p99 | 0.0015ms | 0.0054ms | -0.0039ms | -72.54% |
| mean | 0.00035ms | 0.00078ms | -0.00043ms | -55.75% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0079ms | 0.01ms | -0.0041ms | -34.26% |
| total | 0.07ms | 0.16ms | -0.09ms | -55.75% |

### anvilKeyLookup

# Perf Report — anvilKeyLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00052ms |
| p99 | 0.0017ms |
| mean | 0.00026ms |
| stdev | 0.00032ms |
| min | 0.00017ms |
| max | 0.0026ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00052ms | 0.00025ms | +0.00027ms | +106.60% |
| p99 | 0.0017ms | 0.00075ms | +0.00096ms | +127.84% |
| mean | 0.00026ms | 0.00022ms | +0.000048ms | +22.14% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0026ms | 0.0035ms | -0.00087ms | -25.00% |
| total | 0.05ms | 0.04ms | +0.0096ms | +22.14% |

