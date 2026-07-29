# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0037ms | 0.0050ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0033ms | 0.0050ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.02ms | 0.03ms | 100ms | 0.00055ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | cpu | 0.08ms | 0.0037ms | 0.045 | 0.046 | 0.0038ms | 0.0038ms |
| template_render_batch (5 render with data) | cpu | 0.08ms | 0.0033ms | 0.041 | 0.043 | 0.0034ms | 0.0035ms |
| webhook_verify_delivery_batch (5 verify + parse) | cpu | 0.08ms | 0.02ms | 0.266 | 0.274 | 0.02ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.02ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 2168 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -3672 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 13840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0037ms |
| p50 | 0.0039ms |
| p95 | 0.0050ms |
| p99 | 0.0051ms |
| mean | 0.0041ms |
| stdev | 0.00044ms |
| min | 0.0037ms |
| max | 0.0051ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0038ms | -0.000038ms | -1.00% |
| p50 | 0.0039ms | 0.0043ms | -0.00044ms | -10.14% |
| p95 | 0.0050ms | 0.02ms | -0.01ms | -73.43% |
| p99 | 0.0051ms | 0.02ms | -0.02ms | -75.36% |
| mean | 0.0041ms | 0.0061ms | -0.0020ms | -33.35% |
| min | 0.0037ms | 0.0037ms | 0.00ms | 0.00% |
| max | 0.0051ms | 0.02ms | -0.02ms | -75.80% |
| total | 0.08ms | 0.12ms | -0.04ms | -33.35% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0035ms |
| p95 | 0.0050ms |
| p99 | 0.0064ms |
| mean | 0.0038ms |
| stdev | 0.00082ms |
| min | 0.0033ms |
| max | 0.0068ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0035ms | -0.00021ms | -5.85% |
| p50 | 0.0035ms | 0.0038ms | -0.00031ms | -8.27% |
| p95 | 0.0050ms | 0.0059ms | -0.00080ms | -13.71% |
| p99 | 0.0064ms | 0.0061ms | +0.00031ms | +5.00% |
| mean | 0.0038ms | 0.0040ms | -0.00028ms | -6.96% |
| min | 0.0033ms | 0.0034ms | -0.000084ms | -2.46% |
| max | 0.0068ms | 0.0062ms | +0.00058ms | +9.41% |
| total | 0.08ms | 0.08ms | -0.0056ms | -6.96% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0035ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0034ms | -13.30% |
| p50 | 0.02ms | 0.03ms | -0.0034ms | -12.87% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -25.08% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -25.43% |
| mean | 0.02ms | 0.03ms | -0.0044ms | -15.30% |
| min | 0.02ms | 0.03ms | -0.0036ms | -14.36% |
| max | 0.03ms | 0.05ms | -0.01ms | -25.51% |
| total | 0.49ms | 0.58ms | -0.09ms | -15.30% |

