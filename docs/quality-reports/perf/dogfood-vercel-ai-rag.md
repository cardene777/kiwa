# Perf Suite — dogfood-vercel-ai-rag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| embed | 0.0027ms | 0.0099ms | 20ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |
| retrieve | 0.0043ms | 0.01ms | 30ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| answer | 8.41ms | 10.19ms | 100ms | 0.00035ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| embed | cpu | 0.08ms | 0.0027ms | 0.033 | 0.034 | 0.0029ms | 0.0030ms |
| retrieve | cpu | 0.08ms | 0.0043ms | 0.052 | 0.053 | 0.0046ms | 0.0047ms |
| answer | cpu | 0.08ms | 8.41ms | 101.608 | 100.487 | 8.82ms | 8.72ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| embed | 0.05ms | 40ms | PASS |
| retrieve | 0.06ms | 60ms | PASS |
| answer | 10.48ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| embed | 28312 B | 0 B | 102400 B | yes | PASS |
| retrieve | 54520 B | 0 B | 102400 B | yes | PASS |
| answer | 48704 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### embed

# Perf Report — embed.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0038ms |
| p95 | 0.0099ms |
| p99 | 0.02ms |
| mean | 0.0048ms |
| stdev | 0.0036ms |
| min | 0.0026ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0030ms | -0.00037ms | -12.12% |
| p50 | 0.0038ms | 0.0049ms | -0.0011ms | -22.33% |
| p95 | 0.0099ms | 0.03ms | -0.02ms | -62.64% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -53.75% |
| mean | 0.0048ms | 0.0082ms | -0.0034ms | -41.02% |
| min | 0.0026ms | 0.0029ms | -0.00025ms | -8.70% |
| max | 0.02ms | 0.04ms | -0.02ms | -45.49% |
| total | 0.19ms | 0.33ms | -0.13ms | -41.02% |

### retrieve

# Perf Report — retrieve.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0043ms |
| p50 | 0.0046ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0061ms |
| stdev | 0.0032ms |
| min | 0.0043ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0047ms | -0.00038ms | -8.05% |
| p50 | 0.0046ms | 0.0065ms | -0.0019ms | -29.03% |
| p95 | 0.01ms | 0.02ms | -0.0090ms | -39.46% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -60.00% |
| mean | 0.0061ms | 0.0090ms | -0.0030ms | -32.85% |
| min | 0.0043ms | 0.0046ms | -0.00037ms | -8.11% |
| max | 0.02ms | 0.05ms | -0.03ms | -62.66% |
| total | 0.24ms | 0.36ms | -0.12ms | -32.85% |

### answer

# Perf Report — answer.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 8.41ms |
| p50 | 9.83ms |
| p95 | 10.19ms |
| p99 | 10.21ms |
| mean | 9.43ms |
| stdev | 0.75ms |
| min | 8.15ms |
| max | 10.22ms |
| total | 377.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.41ms | 8.72ms | -0.31ms | -3.59% |
| p50 | 9.83ms | 9.18ms | +0.65ms | +7.10% |
| p95 | 10.19ms | 9.22ms | +0.97ms | +10.50% |
| p99 | 10.21ms | 9.28ms | +0.93ms | +10.07% |
| mean | 9.43ms | 9.07ms | +0.36ms | +3.99% |
| min | 8.15ms | 8.03ms | +0.11ms | +1.39% |
| max | 10.22ms | 9.28ms | +0.94ms | +10.18% |
| total | 377.31ms | 362.84ms | +14.48ms | +3.99% |

