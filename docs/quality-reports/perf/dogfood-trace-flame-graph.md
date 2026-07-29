# Perf Suite — dogfood-trace-flame-graph

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loadTrace | 0.0010ms | 0.0050ms | 20ms | 0.00092ms | PASS | stable (差 0.00063ms が下限 0.00092ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| renderFlame | 0.00054ms | 0.0014ms | 30ms | 0.00092ms | PASS | stable (検知には +0.00092ms (baseline 比 +157%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| drillDown | 0.00054ms | 0.0046ms | 20ms | 0.00092ms | PASS | stable (検知には +0.00092ms (baseline 比 +169%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loadTrace | 0.03ms | 40ms | PASS |
| renderFlame | 0.01ms | 60ms | PASS |
| drillDown | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loadTrace | 12488 B | -36268 B | 102400 B | yes | PASS |
| renderFlame | 24664 B | 0 B | 102400 B | yes | PASS |
| drillDown | 53328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loadTrace

# Perf Report — loadTrace.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0050ms |
| p99 | 0.0067ms |
| mean | 0.0015ms |
| stdev | 0.0013ms |
| min | 0.0010ms |
| max | 0.0073ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00042ms | +0.00063ms | +150.24% |
| p50 | 0.0011ms | 0.00046ms | +0.00062ms | +135.95% |
| p95 | 0.0050ms | 0.0027ms | +0.0023ms | +84.03% |
| p99 | 0.0067ms | 0.0036ms | +0.0031ms | +84.94% |
| mean | 0.0015ms | 0.00071ms | +0.00081ms | +113.79% |
| min | 0.0010ms | 0.00042ms | +0.00058ms | +140.38% |
| max | 0.0073ms | 0.0041ms | +0.0032ms | +77.79% |
| total | 0.06ms | 0.03ms | +0.03ms | +113.79% |

### renderFlame

# Perf Report — renderFlame.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0014ms |
| p99 | 0.0047ms |
| mean | 0.00085ms |
| stdev | 0.00089ms |
| min | 0.00054ms |
| max | 0.0055ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00058ms | -0.000042ms | -7.20% |
| p50 | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| p95 | 0.0014ms | 0.0017ms | -0.00024ms | -14.33% |
| p99 | 0.0047ms | 0.0040ms | +0.00062ms | +15.33% |
| mean | 0.00085ms | 0.00086ms | -0.000014ms | -1.58% |
| min | 0.00054ms | 0.00058ms | -0.000042ms | -7.20% |
| max | 0.0055ms | 0.0045ms | +0.0010ms | +23.35% |
| total | 0.03ms | 0.03ms | -0.00055ms | -1.58% |

### drillDown

# Perf Report — drillDown.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0046ms |
| p99 | 0.0063ms |
| mean | 0.0011ms |
| stdev | 0.0014ms |
| min | 0.00054ms |
| max | 0.0066ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p50 | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| p95 | 0.0046ms | 0.0043ms | +0.00034ms | +7.82% |
| p99 | 0.0063ms | 0.0060ms | +0.00034ms | +5.69% |
| mean | 0.0011ms | 0.0011ms | -0.0000011ms | -0.10% |
| min | 0.00054ms | 0.00054ms | -0.0000010ms | -0.18% |
| max | 0.0066ms | 0.0063ms | +0.00029ms | +4.64% |
| total | 0.04ms | 0.04ms | -0.000044ms | -0.10% |

