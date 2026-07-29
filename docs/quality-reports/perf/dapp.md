# Perf Suite — dapp

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| eventEmitterEmit | 0.00025ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| anvilKeyLookup | 0.00017ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| eventEmitterEmit | 0.01ms | 10ms | PASS |
| anvilKeyLookup | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| eventEmitterEmit | -37216 B | 0 B | 102400 B | yes | PASS |
| anvilKeyLookup | -468504 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.0023ms |
| mean | 0.00036ms |
| stdev | 0.00062ms |
| min | 0.00021ms |
| max | 0.0068ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00054ms | -0.00029ms | -53.79% |
| p50 | 0.00029ms | 0.00063ms | -0.00033ms | -53.44% |
| p95 | 0.00038ms | 0.00084ms | -0.00046ms | -54.90% |
| p99 | 0.0023ms | 0.0054ms | -0.0031ms | -57.65% |
| mean | 0.00036ms | 0.00078ms | -0.00042ms | -53.32% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0068ms | 0.01ms | -0.0052ms | -43.24% |
| total | 0.07ms | 0.16ms | -0.08ms | -53.32% |

### anvilKeyLookup

# Perf Report — anvilKeyLookup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00084ms |
| p99 | 0.0011ms |
| mean | 0.00025ms |
| stdev | 0.00044ms |
| min | 0.00013ms |
| max | 0.0044ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00084ms | 0.00025ms | +0.00059ms | +232.07% |
| p99 | 0.0011ms | 0.00075ms | +0.00032ms | +42.73% |
| mean | 0.00025ms | 0.00022ms | +0.000032ms | +14.97% |
| min | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| max | 0.0044ms | 0.0035ms | +0.00092ms | +26.20% |
| total | 0.05ms | 0.04ms | +0.0065ms | +14.97% |

