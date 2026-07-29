# Perf Suite — component-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.0023ms | 0.0097ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.0012ms | 0.0056ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| chromatic_visual_snapshot (create mock x 30) | 0.0021ms | 0.01ms | 50ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | cpu | 0.08ms | 0.0023ms | 0.027 | 0.026 | 0.0022ms | 0.0021ms |
| playwright_ct_mock_lifecycle (create mock x 30) | cpu | 0.08ms | 0.0012ms | 0.014 | 0.018 | 0.0012ms | 0.0015ms |
| chromatic_visual_snapshot (create mock x 30) | cpu | 0.08ms | 0.0021ms | 0.026 | 0.031 | 0.0021ms | 0.0025ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| storybook_registry_burst (create registry x 30) | 0.01ms | 100ms | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | 0.01ms | 100ms | PASS |
| chromatic_visual_snapshot (create mock x 30) | 0.01ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| storybook_registry_burst (create registry x 30) | -13688 B | 0 B | 102400 B | yes | PASS |
| playwright_ct_mock_lifecycle (create mock x 30) | -680 B | 0 B | 102400 B | yes | PASS |
| chromatic_visual_snapshot (create mock x 30) | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### storybook_registry_burst (create registry x 30)

# Perf Report — storybook_registry_burst (create registry x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0039ms |
| p95 | 0.0097ms |
| p99 | 0.01ms |
| mean | 0.0044ms |
| stdev | 0.0024ms |
| min | 0.0015ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0021ms | +0.00020ms | +9.94% |
| p50 | 0.0039ms | 0.0041ms | -0.00021ms | -5.12% |
| p95 | 0.0097ms | 0.01ms | -0.0028ms | -22.35% |
| p99 | 0.01ms | 0.01ms | -0.0021ms | -14.95% |
| mean | 0.0044ms | 0.0055ms | -0.0010ms | -19.07% |
| min | 0.0015ms | 0.0014ms | +0.00012ms | +8.82% |
| max | 0.01ms | 0.01ms | -0.0019ms | -13.31% |
| total | 0.09ms | 0.11ms | -0.02ms | -19.07% |

### playwright_ct_mock_lifecycle (create mock x 30)

# Perf Report — playwright_ct_mock_lifecycle (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0012ms |
| p50 | 0.0018ms |
| p95 | 0.0056ms |
| p99 | 0.0092ms |
| mean | 0.0024ms |
| stdev | 0.0021ms |
| min | 0.0011ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0015ms | -0.00031ms | -21.17% |
| p50 | 0.0018ms | 0.0026ms | -0.00088ms | -33.33% |
| p95 | 0.0056ms | 0.0065ms | -0.00091ms | -14.06% |
| p99 | 0.0092ms | 0.0094ms | -0.00022ms | -2.29% |
| mean | 0.0024ms | 0.0031ms | -0.00070ms | -22.54% |
| min | 0.0011ms | 0.0010ms | +0.000083ms | +8.30% |
| max | 0.01ms | 0.01ms | -0.000042ms | -0.41% |
| total | 0.05ms | 0.06ms | -0.01ms | -22.54% |

### chromatic_visual_snapshot (create mock x 30)

# Perf Report — chromatic_visual_snapshot (create mock x 30).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0036ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0044ms |
| stdev | 0.0030ms |
| min | 0.0017ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0025ms | -0.00040ms | -15.87% |
| p50 | 0.0036ms | 0.0036ms | -0.000020ms | -0.55% |
| p95 | 0.01ms | 0.01ms | -0.000066ms | -0.53% |
| p99 | 0.01ms | 0.02ms | -0.0061ms | -32.89% |
| mean | 0.0044ms | 0.0049ms | -0.00053ms | -10.69% |
| min | 0.0017ms | 0.0017ms | -0.000041ms | -2.40% |
| max | 0.01ms | 0.02ms | -0.0077ms | -37.86% |
| total | 0.09ms | 0.10ms | -0.01ms | -10.69% |

