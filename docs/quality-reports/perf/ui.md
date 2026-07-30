# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.18ms | 0.43ms | 30ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.14ms | 0.27ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | cpu | 0.08ms | 0.09ms | 0.18ms | 2.269 | 2.322 | 0.19ms | 0.19ms |
| setupComponentEnvRender | cpu | 0.08ms | 0.09ms | 0.14ms | 1.679 | 1.649 | 0.14ms | 0.13ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 1.67ms | 60ms | PASS |
| setupComponentEnvRender | 0.58ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | -71504 B | 0 B | 102400 B | yes | PASS |
| setupComponentEnvRender | -74960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.18ms |
| p50 | 0.21ms |
| p95 | 0.43ms |
| p99 | 0.55ms |
| mean | 0.24ms |
| stdev | 0.09ms |
| min | 0.17ms |
| max | 0.55ms |
| total | 12.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.017)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.19ms | -0.0043ms | -2.28% |
| p50 | 0.22ms | 0.22ms | -0.0026ms | -1.19% |
| p95 | 0.43ms | 0.47ms | -0.04ms | -8.13% |
| p99 | 0.56ms | 0.55ms | +0.0094ms | +1.73% |
| mean | 0.25ms | 0.25ms | -0.0058ms | -2.29% |
| min | 0.18ms | 0.17ms | +0.0037ms | +2.12% |
| max | 0.56ms | 0.55ms | +0.0079ms | +1.43% |
| total | 12.29ms | 12.58ms | -0.29ms | -2.29% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.14ms |
| p50 | 0.15ms |
| p95 | 0.27ms |
| p99 | 0.63ms |
| mean | 0.18ms |
| stdev | 0.10ms |
| min | 0.12ms |
| max | 0.80ms |
| total | 9.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.997)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.14ms | 0.13ms | +0.0024ms | +1.83% |
| p50 | 0.15ms | 0.16ms | -0.0040ms | -2.49% |
| p95 | 0.27ms | 0.30ms | -0.03ms | -10.81% |
| p99 | 0.63ms | 0.37ms | +0.27ms | +72.53% |
| mean | 0.18ms | 0.18ms | +0.0029ms | +1.61% |
| min | 0.12ms | 0.13ms | -0.0060ms | -4.74% |
| max | 0.80ms | 0.39ms | +0.41ms | +103.28% |
| total | 9.14ms | 9.00ms | +0.14ms | +1.61% |

