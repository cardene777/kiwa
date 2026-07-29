# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0013ms | 0.01ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.0061ms | 0.03ms | 30ms | 0.00049ms | PASS | stable (p10 +0% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0020ms | 0.0024ms | 30ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | cpu | 0.08ms | 0.0013ms | 0.016 | 0.015 | 0.0013ms | 0.0012ms |
| schema_validate_loop (50 validateSchema) | cpu | 0.08ms | 0.0061ms | 0.075 | 0.074 | 0.0060ms | 0.0060ms |
| server_lifecycle (register + unregister × 10 cycle) | cpu | 0.08ms | 0.0020ms | 0.024 | 0.024 | 0.0020ms | 0.0020ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.03ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.02ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | -18328 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 7072 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 5736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0038ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0039ms |
| min | 0.0011ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0012ms | +0.000071ms | +5.78% |
| p50 | 0.0038ms | 0.0039ms | -0.000041ms | -1.06% |
| p95 | 0.01ms | 0.01ms | +0.0015ms | +12.71% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -56.96% |
| mean | 0.0049ms | 0.0056ms | -0.00077ms | -13.75% |
| min | 0.0011ms | 0.0011ms | -0.0000010ms | -0.09% |
| max | 0.02ms | 0.05ms | -0.03ms | -63.61% |
| total | 0.15ms | 0.17ms | -0.02ms | -13.75% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0061ms |
| p50 | 0.0065ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0060ms |
| max | 0.12ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0060ms | +0.000088ms | +1.46% |
| p50 | 0.0065ms | 0.0062ms | +0.00027ms | +4.38% |
| p95 | 0.03ms | 0.02ms | +0.0062ms | +24.96% |
| p99 | 0.10ms | 0.03ms | +0.07ms | +216.90% |
| mean | 0.01ms | 0.01ms | +0.0044ms | +42.96% |
| min | 0.0060ms | 0.0059ms | +0.000084ms | +1.42% |
| max | 0.12ms | 0.03ms | +0.09ms | +274.90% |
| total | 0.44ms | 0.31ms | +0.13ms | +42.96% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0024ms |
| p99 | 0.0026ms |
| mean | 0.0021ms |
| stdev | 0.00017ms |
| min | 0.0019ms |
| max | 0.0027ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.000037ms | -1.85% |
| p50 | 0.0020ms | 0.0021ms | -0.000042ms | -2.02% |
| p95 | 0.0024ms | 0.0054ms | -0.0030ms | -55.23% |
| p99 | 0.0026ms | 0.0086ms | -0.0060ms | -69.58% |
| mean | 0.0021ms | 0.0025ms | -0.00046ms | -17.95% |
| min | 0.0019ms | 0.0020ms | -0.000083ms | -4.24% |
| max | 0.0027ms | 0.0095ms | -0.0069ms | -72.05% |
| total | 0.06ms | 0.08ms | -0.01ms | -17.95% |

