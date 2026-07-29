# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00021ms | 0.0016ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +136%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dispatch | 0.00033ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| selectState | 0.00021ms | 0.00034ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +161%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| createStore | cpu | 0.08ms | 0.00021ms | 0.003 | 0.003 | 0.00021ms | 0.00025ms |
| dispatch | cpu | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00033ms | 0.00029ms |
| selectState | cpu | 0.08ms | 0.00021ms | 0.003 | 0.003 | 0.00021ms | 0.00021ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.01ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | -3832 B | 0 B | 102400 B | yes | PASS |
| dispatch | -15104 B | 0 B | 102400 B | yes | PASS |
| selectState | 28464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.0016ms |
| p99 | 0.0055ms |
| mean | 0.00047ms |
| stdev | 0.00090ms |
| min | 0.00021ms |
| max | 0.0082ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.0016ms | 0.0029ms | -0.0013ms | -44.30% |
| p99 | 0.0055ms | 0.0067ms | -0.0012ms | -17.49% |
| mean | 0.00047ms | 0.00062ms | -0.00015ms | -24.11% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0082ms | 0.01ms | -0.0040ms | -33.11% |
| total | 0.09ms | 0.12ms | -0.03ms | -24.11% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.0021ms |
| p99 | 0.0097ms |
| mean | 0.00065ms |
| stdev | 0.0016ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00029ms | +0.000041ms | +14.04% |
| p50 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p95 | 0.0021ms | 0.0023ms | -0.00022ms | -9.25% |
| p99 | 0.0097ms | 0.0083ms | +0.0014ms | +16.49% |
| mean | 0.00065ms | 0.00062ms | +0.000025ms | +3.98% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0042ms | +34.60% |
| total | 0.13ms | 0.12ms | +0.0049ms | +3.98% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00034ms |
| p99 | 0.0023ms |
| mean | 0.00036ms |
| stdev | 0.0013ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| p95 | 0.00034ms | 0.0036ms | -0.0033ms | -90.66% |
| p99 | 0.0023ms | 0.0062ms | -0.0040ms | -63.66% |
| mean | 0.00036ms | 0.00071ms | -0.00035ms | -49.77% |
| min | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| max | 0.02ms | 0.02ms | -0.0028ms | -13.04% |
| total | 0.07ms | 0.14ms | -0.07ms | -49.77% |

