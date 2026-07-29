# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| requestClientGet | 0.0088ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| requestClientPost | 0.0071ms | 0.0095ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.24ms | 10ms | PASS |
| requestClientPost | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | -27240 B | 0 B | 102400 B | yes | PASS |
| requestClientPost | 1512 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0088ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0085ms |
| max | 0.10ms |
| total | 2.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0091ms | -0.00025ms | -2.71% |
| p50 | 0.01ms | 0.01ms | +0.00038ms | +3.69% |
| p95 | 0.03ms | 0.03ms | +0.0016ms | +5.45% |
| p99 | 0.07ms | 0.07ms | +0.0057ms | +8.66% |
| mean | 0.01ms | 0.01ms | +0.00025ms | +1.78% |
| min | 0.0085ms | 0.0087ms | -0.00012ms | -1.43% |
| max | 0.10ms | 0.10ms | +0.0051ms | +5.18% |
| total | 2.86ms | 2.81ms | +0.05ms | +1.78% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0071ms |
| p50 | 0.0073ms |
| p95 | 0.0095ms |
| p99 | 0.02ms |
| mean | 0.0077ms |
| stdev | 0.0019ms |
| min | 0.0068ms |
| max | 0.02ms |
| total | 1.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0072ms | -0.00012ms | -1.72% |
| p50 | 0.0073ms | 0.0074ms | -0.000083ms | -1.13% |
| p95 | 0.0095ms | 0.0088ms | +0.00074ms | +8.43% |
| p99 | 0.02ms | 0.02ms | -0.0022ms | -11.39% |
| mean | 0.0077ms | 0.0078ms | -0.000050ms | -0.64% |
| min | 0.0068ms | 0.0071ms | -0.00025ms | -3.53% |
| max | 0.02ms | 0.03ms | -0.0042ms | -16.64% |
| total | 1.55ms | 1.56ms | -0.01ms | -0.64% |

