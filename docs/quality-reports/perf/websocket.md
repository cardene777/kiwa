# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00025ms | 0.0012ms | 5ms | 0.00035ms | PASS | stable (検知には +0.00035ms (baseline 比 +138%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00029ms | 0.00080ms | 5ms | 0.00035ms | PASS | stable (検知には +0.00035ms (baseline 比 +104%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00029ms | 0.00092ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| sendMessage | cpu | 0.08ms | 0.00025ms | 0.003 | 0.003 | 0.00026ms | 0.00025ms |
| broadcastMessage | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00030ms | 0.00033ms |
| captureBinaryFrame | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00029ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -6368 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 6040 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 10256 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.0012ms |
| p99 | 0.0065ms |
| mean | 0.00054ms |
| stdev | 0.0014ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00029ms | -0.000042ms | -14.38% |
| p95 | 0.0012ms | 0.0036ms | -0.0024ms | -66.85% |
| p99 | 0.0065ms | 0.010ms | -0.0035ms | -35.31% |
| mean | 0.00054ms | 0.00099ms | -0.00044ms | -45.07% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.02ms | 0.03ms | -0.010ms | -38.03% |
| total | 0.11ms | 0.20ms | -0.09ms | -45.07% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00080ms |
| p99 | 0.0038ms |
| mean | 0.00048ms |
| stdev | 0.00086ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| p95 | 0.00080ms | 0.0028ms | -0.0020ms | -71.22% |
| p99 | 0.0038ms | 0.02ms | -0.01ms | -75.01% |
| mean | 0.00048ms | 0.0012ms | -0.00074ms | -60.94% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.09ms | -0.08ms | -87.97% |
| total | 0.10ms | 0.24ms | -0.15ms | -60.94% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.00092ms |
| p99 | 0.0082ms |
| mean | 0.00060ms |
| stdev | 0.0019ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p95 | 0.00092ms | 0.0014ms | -0.00050ms | -34.96% |
| p99 | 0.0082ms | 0.0079ms | +0.00030ms | +3.81% |
| mean | 0.00060ms | 0.00066ms | -0.000059ms | -8.99% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0017ms | -6.69% |
| total | 0.12ms | 0.13ms | -0.01ms | -8.99% |

