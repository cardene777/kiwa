# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.13ms | 0.42ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.04ms | 50ms | 0.00043ms | PASS | regressed — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.05ms | 0.05ms | 50ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | cpu | 0.08ms | 0.13ms | 1.600 | 1.462 | 0.13ms | 0.12ms |
| large_spec_conformance (spec 80 keys × 5 iter) | cpu | 0.08ms | 0.03ms | 0.363 | 0.288 | 0.03ms | 0.02ms |
| regression_scan_burst (50 element layout × 10 iter) | cpu | 0.08ms | 0.05ms | 0.606 | 0.598 | 0.05ms | 0.05ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.39ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.14ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.23ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -20608 B | 0 B | 102400 B | yes | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 55544 B | 0 B | 102400 B | yes | PASS |
| regression_scan_burst (50 element layout × 10 iter) | -1752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.13ms |
| p50 | 0.14ms |
| p95 | 0.42ms |
| p99 | 0.45ms |
| mean | 0.20ms |
| stdev | 0.11ms |
| min | 0.11ms |
| max | 0.46ms |
| total | 5.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.12ms | +0.01ms | +10.37% |
| p50 | 0.14ms | 0.15ms | -0.0056ms | -3.77% |
| p95 | 0.42ms | 0.41ms | +0.01ms | +2.50% |
| p99 | 0.45ms | 0.45ms | +0.0020ms | +0.44% |
| mean | 0.20ms | 0.19ms | +0.0018ms | +0.92% |
| min | 0.11ms | 0.11ms | -0.0044ms | -3.89% |
| max | 0.46ms | 0.47ms | -0.0087ms | -1.87% |
| total | 5.85ms | 5.80ms | +0.05ms | +0.92% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0038ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0053ms | +21.95% |
| p50 | 0.03ms | 0.03ms | +0.0050ms | +19.66% |
| p95 | 0.04ms | 0.03ms | +0.0079ms | +27.14% |
| p99 | 0.05ms | 0.03ms | +0.01ms | +40.53% |
| mean | 0.03ms | 0.03ms | +0.0058ms | +22.77% |
| min | 0.03ms | 0.02ms | +0.0051ms | +21.58% |
| max | 0.05ms | 0.03ms | +0.02ms | +47.72% |
| total | 0.94ms | 0.77ms | +0.18ms | +22.77% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0020ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00085ms | -1.70% |
| p50 | 0.05ms | 0.05ms | -0.0015ms | -3.01% |
| p95 | 0.05ms | 0.06ms | -0.0015ms | -2.75% |
| p99 | 0.06ms | 0.08ms | -0.03ms | -32.85% |
| mean | 0.05ms | 0.05ms | -0.0024ms | -4.49% |
| min | 0.05ms | 0.05ms | -0.00025ms | -0.52% |
| max | 0.06ms | 0.09ms | -0.04ms | -40.16% |
| total | 1.51ms | 1.58ms | -0.07ms | -4.49% |

