# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.20ms | 1.31ms | 30ms | 0.00033ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +177% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.15ms | 1.04ms | 30ms | 0.00032ms | PASS | stable (換算後 p10 +8% (閾値未満)、 p95 +237% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | cpu | 0.08ms | 0.10ms | 0.20ms | 2.448 | 2.322 | 0.20ms | 0.19ms |
| setupComponentEnvRender | cpu | 0.08ms | 0.12ms | 0.15ms | 1.785 | 1.649 | 0.14ms | 0.13ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 4.70ms | 60ms | PASS |
| setupComponentEnvRender | 0.64ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -75680 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -37328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.24ms |
| p95 | 1.31ms |
| p99 | 4.58ms |
| mean | 0.51ms |
| stdev | 1.07ms |
| min | 0.20ms |
| max | 7.68ms |
| total | 25.61ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.996)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.19ms | +0.01ms | +5.41% |
| p50 | 0.24ms | 0.22ms | +0.02ms | +7.15% |
| p95 | 1.30ms | 0.47ms | +0.83ms | +176.82% |
| p99 | 4.56ms | 0.55ms | +4.01ms | +733.92% |
| mean | 0.51ms | 0.25ms | +0.26ms | +102.87% |
| min | 0.20ms | 0.17ms | +0.02ms | +12.52% |
| max | 7.65ms | 0.55ms | +7.10ms | +1292.05% |
| total | 25.51ms | 12.58ms | +12.94ms | +102.87% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.18ms |
| p95 | 1.04ms |
| p99 | 1.51ms |
| mean | 0.29ms |
| stdev | 0.32ms |
| min | 0.14ms |
| max | 1.63ms |
| total | 14.50ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.975)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.13ms | +0.01ms | +8.24% |
| p50 | 0.18ms | 0.16ms | +0.02ms | +12.33% |
| p95 | 1.01ms | 0.30ms | +0.71ms | +237.07% |
| p99 | 1.48ms | 0.37ms | +1.11ms | +303.04% |
| mean | 0.28ms | 0.18ms | +0.10ms | +57.08% |
| min | 0.13ms | 0.13ms | +0.0059ms | +4.62% |
| max | 1.59ms | 0.39ms | +1.19ms | +303.27% |
| total | 14.14ms | 9.00ms | +5.14ms | +57.08% |

