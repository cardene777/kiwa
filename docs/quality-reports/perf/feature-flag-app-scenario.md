# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0063ms | 0.0083ms | 100ms | 0.00055ms | PASS | stable — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0057ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0028ms | 0.0038ms | 100ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | cpu | 0.08ms | 0.0063ms | 0.077 | 0.079 | 0.0069ms | 0.0070ms |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | cpu | 0.08ms | 0.0057ms | 0.069 | 0.062 | 0.0057ms | 0.0051ms |
| rule_error_handling (5 unknown flag + attribute mismatch) | cpu | 0.08ms | 0.0028ms | 0.035 | 0.037 | 0.0030ms | 0.0031ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.05ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 13928 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 4992 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0063ms |
| p50 | 0.0065ms |
| p95 | 0.0083ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.0016ms |
| min | 0.0063ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0070ms | -0.00075ms | -10.65% |
| p50 | 0.0065ms | 0.0073ms | -0.00075ms | -10.28% |
| p95 | 0.0083ms | 0.0092ms | -0.00092ms | -10.00% |
| p99 | 0.01ms | 0.01ms | -0.00098ms | -7.41% |
| mean | 0.0070ms | 0.0078ms | -0.00077ms | -9.81% |
| min | 0.0063ms | 0.0070ms | -0.00075ms | -10.71% |
| max | 0.01ms | 0.01ms | -0.0010ms | -7.00% |
| total | 0.14ms | 0.16ms | -0.02ms | -9.81% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0067ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.0017ms |
| min | 0.0056ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0051ms | +0.00058ms | +11.39% |
| p50 | 0.0067ms | 0.0060ms | +0.00065ms | +10.69% |
| p95 | 0.01ms | 0.01ms | -0.00092ms | -7.92% |
| p99 | 0.01ms | 0.02ms | -0.0087ms | -43.47% |
| mean | 0.0070ms | 0.0070ms | +0.0000083ms | +0.12% |
| min | 0.0056ms | 0.0050ms | +0.00058ms | +11.56% |
| max | 0.01ms | 0.02ms | -0.01ms | -48.20% |
| total | 0.14ms | 0.14ms | +0.00017ms | +0.12% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0028ms |
| p50 | 0.0029ms |
| p95 | 0.0038ms |
| p99 | 0.0059ms |
| mean | 0.0032ms |
| stdev | 0.00081ms |
| min | 0.0028ms |
| max | 0.0065ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0031ms | -0.00024ms | -7.83% |
| p50 | 0.0029ms | 0.0032ms | -0.00031ms | -9.76% |
| p95 | 0.0038ms | 0.02ms | -0.02ms | -80.11% |
| p99 | 0.0059ms | 0.03ms | -0.02ms | -80.65% |
| mean | 0.0032ms | 0.0060ms | -0.0028ms | -47.15% |
| min | 0.0028ms | 0.0030ms | -0.00017ms | -5.57% |
| max | 0.0065ms | 0.03ms | -0.03ms | -80.72% |
| total | 0.06ms | 0.12ms | -0.06ms | -47.15% |

