# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0062ms | 0.0090ms | 100ms | 0.00053ms | PASS | stable — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0062ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0028ms | 0.0042ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | cpu | 0.08ms | 0.09ms | 0.0062ms | 0.078 | 0.077 | 0.0065ms | 0.0065ms |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | cpu | 0.08ms | 0.09ms | 0.0062ms | 0.075 | 0.063 | 0.0060ms | 0.0051ms |
| rule_error_handling (5 unknown flag + attribute mismatch) | cpu | 0.08ms | 0.08ms | 0.0028ms | 0.035 | 0.036 | 0.0029ms | 0.0030ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.05ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 12552 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 10768 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.0065ms |
| p95 | 0.0090ms |
| p99 | 0.01ms |
| mean | 0.0069ms |
| stdev | 0.0014ms |
| min | 0.0062ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.050)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0065ms | +0.000062ms | +0.97% |
| p50 | 0.0068ms | 0.0067ms | +0.00014ms | +2.08% |
| p95 | 0.0095ms | 0.0083ms | +0.0012ms | +14.50% |
| p99 | 0.01ms | 0.01ms | +0.00060ms | +5.17% |
| mean | 0.0073ms | 0.0071ms | +0.00020ms | +2.78% |
| min | 0.0065ms | 0.0063ms | +0.00014ms | +2.27% |
| max | 0.01ms | 0.01ms | +0.00046ms | +3.64% |
| total | 0.15ms | 0.14ms | +0.0039ms | +2.78% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.0072ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0078ms |
| stdev | 0.0019ms |
| min | 0.0060ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.972)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0051ms | +0.00091ms | +17.83% |
| p50 | 0.0070ms | 0.0061ms | +0.00088ms | +14.36% |
| p95 | 0.01ms | 0.01ms | +0.00085ms | +7.75% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -44.97% |
| mean | 0.0076ms | 0.0072ms | +0.00032ms | +4.48% |
| min | 0.0058ms | 0.0050ms | +0.00079ms | +15.80% |
| max | 0.01ms | 0.03ms | -0.01ms | -50.77% |
| total | 0.15ms | 0.14ms | +0.0065ms | +4.48% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0028ms |
| p50 | 0.0029ms |
| p95 | 0.0042ms |
| p99 | 0.0063ms |
| mean | 0.0032ms |
| stdev | 0.00090ms |
| min | 0.0028ms |
| max | 0.0068ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.014)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.000084ms | -2.85% |
| p50 | 0.0029ms | 0.0030ms | -0.00013ms | -4.12% |
| p95 | 0.0042ms | 0.0052ms | -0.00098ms | -18.83% |
| p99 | 0.0064ms | 0.0067ms | -0.00035ms | -5.24% |
| mean | 0.0033ms | 0.0034ms | -0.00011ms | -3.13% |
| min | 0.0028ms | 0.0029ms | -0.000085ms | -2.91% |
| max | 0.0069ms | 0.0071ms | -0.00019ms | -2.73% |
| total | 0.07ms | 0.07ms | -0.0021ms | -3.13% |

