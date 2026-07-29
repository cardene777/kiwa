# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| embed | 0.0044ms | 0.01ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| retrieve | 0.0074ms | 0.03ms | 30ms | 0.00042ms | PASS | stable (p10 +20% (閾値未満)、 p95 +70% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| answer | 8.58ms | 9.35ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.07ms | 40ms | PASS |
| retrieve | 0.18ms | 60ms | PASS |
| answer | 9.46ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| embed | 11056 B | 0 B | 102400 B | yes | PASS |
| retrieve | 47824 B | 0 B | 102400 B | yes | PASS |
| answer | 48768 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0044ms |
| p50 | 0.0058ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0072ms |
| stdev | 0.0037ms |
| min | 0.0043ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0039ms | +0.00050ms | +12.69% |
| p50 | 0.0058ms | 0.0040ms | +0.0018ms | +45.33% |
| p95 | 0.01ms | 0.01ms | +0.0020ms | +16.60% |
| p99 | 0.02ms | 0.02ms | -0.00017ms | -0.89% |
| mean | 0.0072ms | 0.0057ms | +0.0015ms | +27.20% |
| min | 0.0043ms | 0.0039ms | +0.00046ms | +11.85% |
| max | 0.02ms | 0.02ms | -0.00079ms | -3.79% |
| total | 0.29ms | 0.23ms | +0.06ms | +27.20% |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0074ms |
| p50 | 0.0090ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0088ms |
| min | 0.0067ms |
| max | 0.04ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0062ms | +0.0012ms | +19.53% |
| p50 | 0.0090ms | 0.0065ms | +0.0024ms | +36.93% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +70.07% |
| p99 | 0.04ms | 0.03ms | +0.0094ms | +30.57% |
| mean | 0.01ms | 0.0091ms | +0.0040ms | +44.58% |
| min | 0.0067ms | 0.0059ms | +0.00079ms | +13.37% |
| max | 0.04ms | 0.03ms | +0.0094ms | +28.68% |
| total | 0.52ms | 0.36ms | +0.16ms | +44.58% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 8.58ms |
| p50 | 9.17ms |
| p95 | 9.35ms |
| p99 | 9.39ms |
| mean | 9.08ms |
| stdev | 0.28ms |
| min | 8.24ms |
| max | 9.39ms |
| total | 363.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.58ms | 8.59ms | -0.0099ms | -0.11% |
| p50 | 9.17ms | 9.14ms | +0.03ms | +0.32% |
| p95 | 9.35ms | 9.18ms | +0.17ms | +1.80% |
| p99 | 9.39ms | 9.38ms | +0.0083ms | +0.09% |
| mean | 9.08ms | 9.03ms | +0.05ms | +0.55% |
| min | 8.24ms | 8.17ms | +0.07ms | +0.86% |
| max | 9.39ms | 9.49ms | -0.10ms | -1.08% |
| total | 363.16ms | 361.18ms | +1.98ms | +0.55% |

