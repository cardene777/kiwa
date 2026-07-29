# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00050ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00099ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.0039ms | 0.02ms | 50ms | 0.00099ms | PASS | improved — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.04ms | 50ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0026ms | 0.01ms | 50ms | 0.0010ms | PASS | stable (p10 +2% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | cpu | 0.08ms | 0.0039ms | 0.047 | 0.073 | 0.0039ms | 0.0061ms |
| cron_scheduling (10 schedule + advanceMs 5 turn) | cpu | 0.08ms | 0.03ms | 0.354 | 0.438 | 0.03ms | 0.04ms |
| integrated_workflow (queue + clock combined) | cpu | 0.08ms | 0.0026ms | 0.032 | 0.032 | 0.0027ms | 0.0027ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.02ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.11ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -21808 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 7992 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | 1888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0039ms |
| p50 | 0.0046ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0074ms |
| stdev | 0.0053ms |
| min | 0.0030ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0061ms | -0.0022ms | -35.81% |
| p50 | 0.0046ms | 0.02ms | -0.01ms | -71.67% |
| p95 | 0.02ms | 0.04ms | -0.03ms | -60.92% |
| p99 | 0.02ms | 0.13ms | -0.11ms | -83.11% |
| mean | 0.0074ms | 0.02ms | -0.02ms | -69.47% |
| min | 0.0030ms | 0.0049ms | -0.0019ms | -38.97% |
| max | 0.02ms | 0.17ms | -0.15ms | -85.45% |
| total | 0.22ms | 0.72ms | -0.50ms | -69.47% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0055ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0099ms | -25.98% |
| p50 | 0.03ms | 0.05ms | -0.02ms | -39.79% |
| p95 | 0.04ms | 0.11ms | -0.07ms | -65.70% |
| p99 | 0.05ms | 0.18ms | -0.13ms | -71.41% |
| mean | 0.03ms | 0.06ms | -0.03ms | -49.65% |
| min | 0.03ms | 0.03ms | -0.0027ms | -8.73% |
| max | 0.06ms | 0.21ms | -0.15ms | -72.44% |
| total | 0.93ms | 1.85ms | -0.92ms | -49.65% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0028ms |
| p95 | 0.01ms |
| p99 | 0.08ms |
| mean | 0.0073ms |
| stdev | 0.02ms |
| min | 0.0025ms |
| max | 0.11ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0027ms | -0.000083ms | -3.06% |
| p50 | 0.0028ms | 0.0028ms | +0.000041ms | +1.47% |
| p95 | 0.01ms | 0.0093ms | +0.0046ms | +49.37% |
| p99 | 0.08ms | 0.01ms | +0.07ms | +517.41% |
| mean | 0.0073ms | 0.0038ms | +0.0035ms | +91.84% |
| min | 0.0025ms | 0.0027ms | -0.00013ms | -4.69% |
| max | 0.11ms | 0.02ms | +0.09ms | +625.52% |
| total | 0.22ms | 0.11ms | +0.11ms | +91.84% |

