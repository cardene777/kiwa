# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| requestClientGet | 0.01ms | 0.04ms | 5ms | 0.00041ms | PASS | stable (p10 +13% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| requestClientPost | 0.0077ms | 0.0092ms | 5ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.31ms | 10ms | PASS |
| requestClientPost | 0.61ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | -124088 B | -44588 B | 102400 B | yes | PASS |
| requestClientPost | 6880 B | 517 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0098ms |
| max | 0.12ms |
| total | 3.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0091ms | +0.0012ms | +12.89% |
| p50 | 0.02ms | 0.01ms | +0.0068ms | +67.01% |
| p95 | 0.04ms | 0.03ms | +0.0062ms | +20.80% |
| p99 | 0.06ms | 0.07ms | -0.0067ms | -10.09% |
| mean | 0.02ms | 0.01ms | +0.0051ms | +36.10% |
| min | 0.0098ms | 0.0087ms | +0.0012ms | +13.48% |
| max | 0.12ms | 0.10ms | +0.02ms | +17.97% |
| total | 3.82ms | 2.81ms | +1.01ms | +36.10% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0080ms |
| p95 | 0.0092ms |
| p99 | 0.01ms |
| mean | 0.0082ms |
| stdev | 0.0011ms |
| min | 0.0076ms |
| max | 0.02ms |
| total | 1.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0072ms | +0.00054ms | +7.52% |
| p50 | 0.0080ms | 0.0074ms | +0.00058ms | +7.91% |
| p95 | 0.0092ms | 0.0088ms | +0.00046ms | +5.29% |
| p99 | 0.01ms | 0.02ms | -0.0059ms | -29.81% |
| mean | 0.0082ms | 0.0078ms | +0.00043ms | +5.55% |
| min | 0.0076ms | 0.0071ms | +0.00050ms | +7.06% |
| max | 0.02ms | 0.03ms | -0.0069ms | -27.18% |
| total | 1.64ms | 1.56ms | +0.09ms | +5.55% |

