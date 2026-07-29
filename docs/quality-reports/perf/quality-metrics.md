# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00033ms | 0.0017ms | 5ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +111%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00025ms | 0.0049ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +144%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| diffReports | 0.00038ms | 0.01ms | 5ms | 0.00032ms | PASS | stable (p10 +9% (閾値未満)、 p95 +566% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | cpu | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00032ms | 0.00029ms |
| evaluateReleaseGate_11axis | cpu | 0.09ms | 0.00025ms | 0.003 | 0.003 | 0.00022ms | 0.00021ms |
| diffReports | cpu | 0.08ms | 0.00038ms | 0.005 | 0.004 | 0.00036ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.02ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -3448 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | 3936 B | 0 B | 102400 B | yes | PASS |
| diffReports | 1664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0017ms |
| p99 | 0.0074ms |
| mean | 0.00070ms |
| stdev | 0.0015ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00029ms | +0.000042ms | +14.43% |
| p50 | 0.00033ms | 0.00033ms | +0.0000010ms | +0.30% |
| p95 | 0.0017ms | 0.0028ms | -0.0012ms | -41.05% |
| p99 | 0.0074ms | 0.01ms | -0.0033ms | -30.95% |
| mean | 0.00070ms | 0.00079ms | -0.000089ms | -11.24% |
| min | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| max | 0.01ms | 0.01ms | +0.00046ms | +3.35% |
| total | 0.14ms | 0.16ms | -0.02ms | -11.24% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.0049ms |
| p99 | 0.01ms |
| mean | 0.0020ms |
| stdev | 0.02ms |
| min | 0.00021ms |
| max | 0.24ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00021ms | +0.000038ms | +18.22% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.0049ms | 0.0011ms | +0.0038ms | +340.71% |
| p99 | 0.01ms | 0.0074ms | +0.0041ms | +56.29% |
| mean | 0.0020ms | 0.00056ms | +0.0014ms | +256.26% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.24ms | 0.02ms | +0.22ms | +1015.48% |
| total | 0.40ms | 0.11ms | +0.29ms | +256.26% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00063ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0032ms |
| stdev | 0.0082ms |
| min | 0.00033ms |
| max | 0.09ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p50 | 0.00063ms | 0.00038ms | +0.00025ms | +66.67% |
| p95 | 0.01ms | 0.0020ms | +0.01ms | +586.61% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +170.59% |
| mean | 0.0032ms | 0.00073ms | +0.0025ms | +343.59% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.09ms | 0.02ms | +0.07ms | +449.11% |
| total | 0.65ms | 0.15ms | +0.50ms | +343.59% |

