# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00042ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable (差 0.000084ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00033ms | 0.00054ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00029ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -6496 B | -47300 B | 102400 B | yes | PASS |
| broadcastMessage | 30672 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 4352 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0014ms |
| p99 | 0.0029ms |
| mean | 0.00062ms |
| stdev | 0.00064ms |
| min | 0.00042ms |
| max | 0.0063ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00033ms | +0.000084ms | +25.23% |
| p50 | 0.00046ms | 0.00038ms | +0.000084ms | +22.40% |
| p95 | 0.0014ms | 0.00055ms | +0.00088ms | +160.21% |
| p99 | 0.0029ms | 0.0039ms | -0.0010ms | -26.20% |
| mean | 0.00062ms | 0.00047ms | +0.00014ms | +29.69% |
| min | 0.00042ms | 0.00033ms | +0.000083ms | +24.92% |
| max | 0.0063ms | 0.0058ms | +0.00046ms | +7.83% |
| total | 0.12ms | 0.09ms | +0.03ms | +29.69% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00054ms |
| p99 | 0.0036ms |
| mean | 0.00048ms |
| stdev | 0.00062ms |
| min | 0.00033ms |
| max | 0.0066ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00054ms | 0.00050ms | +0.000043ms | +8.62% |
| p99 | 0.0036ms | 0.0016ms | +0.0020ms | +127.50% |
| mean | 0.00048ms | 0.00041ms | +0.000074ms | +18.09% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0066ms | 0.0032ms | +0.0034ms | +107.96% |
| total | 0.10ms | 0.08ms | +0.01ms | +18.09% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.00038ms |
| p99 | 0.0086ms |
| mean | 0.00049ms |
| stdev | 0.0014ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00038ms | +5.0e-8ms | +0.01% |
| p99 | 0.0086ms | 0.0022ms | +0.0064ms | +296.25% |
| mean | 0.00049ms | 0.00041ms | +0.000089ms | +21.97% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.0086ms | +0.0067ms | +78.62% |
| total | 0.10ms | 0.08ms | +0.02ms | +21.97% |

