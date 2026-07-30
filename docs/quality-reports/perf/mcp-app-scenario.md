# Perf Suite — mcp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.0020ms | 0.0093ms | 30ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| schema_validate_loop (50 validateSchema) | 0.0060ms | 0.05ms | 30ms | 0.00041ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +117% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| server_lifecycle (register + unregister × 10 cycle) | 0.0020ms | 0.0065ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | cpu | 0.08ms | 0.10ms | 0.0020ms | 0.025 | 0.016 | 0.0021ms | 0.0013ms |
| schema_validate_loop (50 validateSchema) | cpu | 0.08ms | 0.10ms | 0.0060ms | 0.073 | 0.074 | 0.0059ms | 0.0060ms |
| server_lifecycle (register + unregister × 10 cycle) | cpu | 0.08ms | 0.09ms | 0.0020ms | 0.025 | 0.024 | 0.0020ms | 0.0020ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| tool_registration_burst (server + 20 register) | 0.01ms | 60ms | PASS |
| schema_validate_loop (50 validateSchema) | 0.04ms | 60ms | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 0.03ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| tool_registration_burst (server + 20 register) | -18952 B | 0 B | 102400 B | yes | PASS |
| schema_validate_loop (50 validateSchema) | 3072 B | 0 B | 102400 B | yes | PASS |
| server_lifecycle (register + unregister × 10 cycle) | 904 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### tool_registration_burst (server + 20 register)

# Perf Report — tool_registration_burst (server + 20 register).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0039ms |
| p95 | 0.0093ms |
| p99 | 0.02ms |
| mean | 0.0050ms |
| stdev | 0.0040ms |
| min | 0.0011ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.023)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0013ms | +0.00078ms | +58.89% |
| p50 | 0.0040ms | 0.0038ms | +0.00019ms | +5.09% |
| p95 | 0.0095ms | 0.01ms | -0.0023ms | -19.48% |
| p99 | 0.02ms | 0.02ms | -0.00021ms | -1.05% |
| mean | 0.0051ms | 0.0047ms | +0.00041ms | +8.83% |
| min | 0.0011ms | 0.0010ms | +0.000068ms | +6.53% |
| max | 0.02ms | 0.02ms | +0.0012ms | +5.10% |
| total | 0.15ms | 0.14ms | +0.01ms | +8.83% |

### schema_validate_loop (50 validateSchema)

# Perf Report — schema_validate_loop (50 validateSchema).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0060ms |
| p50 | 0.0064ms |
| p95 | 0.05ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0058ms |
| max | 0.12ms |
| total | 0.48ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.988)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0060ms | -0.000069ms | -1.17% |
| p50 | 0.0063ms | 0.0062ms | +0.000092ms | +1.48% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +117.40% |
| p99 | 0.11ms | 0.03ms | +0.08ms | +286.55% |
| mean | 0.02ms | 0.01ms | +0.0053ms | +49.66% |
| min | 0.0058ms | 0.0058ms | -0.000025ms | -0.43% |
| max | 0.12ms | 0.03ms | +0.09ms | +335.06% |
| total | 0.48ms | 0.32ms | +0.16ms | +49.66% |

### server_lifecycle (register + unregister × 10 cycle)

# Perf Report — server_lifecycle (register + unregister × 10 cycle).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0065ms |
| p99 | 0.02ms |
| mean | 0.0029ms |
| stdev | 0.0032ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.019)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | +0.000043ms | +2.14% |
| p50 | 0.0021ms | 0.0021ms | +0.000019ms | +0.93% |
| p95 | 0.0066ms | 0.0070ms | -0.00035ms | -5.02% |
| p99 | 0.02ms | 0.01ms | +0.0013ms | +9.18% |
| mean | 0.0030ms | 0.0029ms | +0.000054ms | +1.84% |
| min | 0.0020ms | 0.0020ms | +0.000039ms | +1.98% |
| max | 0.02ms | 0.02ms | +0.0016ms | +9.52% |
| total | 0.09ms | 0.09ms | +0.0016ms | +1.84% |

