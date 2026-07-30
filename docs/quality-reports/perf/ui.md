# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.22ms | 0.51ms | 30ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.18ms | 0.34ms | 30ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | cpu | 0.09ms | 0.10ms | 0.22ms | 2.414 | 2.322 | 0.20ms | 0.19ms |
| setupComponentEnvRender | cpu | 0.09ms | 0.10ms | 0.18ms | 1.967 | 1.649 | 0.16ms | 0.13ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 1.87ms | 60ms | PASS |
| setupComponentEnvRender | 0.86ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 61400 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -33480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.22ms |
| p50 | 0.25ms |
| p95 | 0.51ms |
| p99 | 1.04ms |
| mean | 0.31ms |
| stdev | 0.17ms |
| min | 0.20ms |
| max | 1.04ms |
| total | 15.39ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.912)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.19ms | +0.0075ms | +3.95% |
| p50 | 0.23ms | 0.22ms | +0.0055ms | +2.51% |
| p95 | 0.46ms | 0.47ms | -0.0081ms | -1.73% |
| p99 | 0.94ms | 0.55ms | +0.40ms | +72.70% |
| mean | 0.28ms | 0.25ms | +0.03ms | +11.59% |
| min | 0.18ms | 0.17ms | +0.0073ms | +4.18% |
| max | 0.94ms | 0.55ms | +0.40ms | +71.92% |
| total | 14.03ms | 12.58ms | +1.46ms | +11.59% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.18ms |
| p50 | 0.21ms |
| p95 | 0.34ms |
| p99 | 0.86ms |
| mean | 0.24ms |
| stdev | 0.15ms |
| min | 0.16ms |
| max | 1.24ms |
| total | 12.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.904)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.16ms | 0.13ms | +0.03ms | +19.24% |
| p50 | 0.19ms | 0.16ms | +0.03ms | +19.10% |
| p95 | 0.30ms | 0.30ms | +0.0034ms | +1.13% |
| p99 | 0.78ms | 0.37ms | +0.41ms | +112.91% |
| mean | 0.22ms | 0.18ms | +0.04ms | +20.88% |
| min | 0.15ms | 0.13ms | +0.02ms | +16.72% |
| max | 1.12ms | 0.39ms | +0.73ms | +184.17% |
| total | 10.88ms | 9.00ms | +1.88ms | +20.88% |

