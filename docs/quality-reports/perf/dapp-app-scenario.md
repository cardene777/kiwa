# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.02ms | 0.04ms | 30ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.10ms | 0.13ms | 50ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.03ms | 0.05ms | 30ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | cpu | 0.08ms | 0.02ms | 0.277 | 0.291 | 0.02ms | 0.02ms |
| bulk_dapp_spec_parse (50 parseSpec rapid) | cpu | 0.08ms | 0.10ms | 1.278 | 1.267 | 0.13ms | 0.13ms |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | cpu | 0.08ms | 0.03ms | 0.329 | 0.374 | 0.03ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.10ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.65ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.13ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -37848 B | -21172 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -19256 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 3048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0078ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0018ms | -7.32% |
| p50 | 0.03ms | 0.04ms | -0.010ms | -24.16% |
| p95 | 0.04ms | 0.11ms | -0.06ms | -58.96% |
| p99 | 0.05ms | 0.16ms | -0.11ms | -70.05% |
| mean | 0.03ms | 0.05ms | -0.02ms | -36.89% |
| min | 0.02ms | 0.02ms | -0.00050ms | -2.23% |
| max | 0.05ms | 0.17ms | -0.13ms | -73.09% |
| total | 0.98ms | 1.56ms | -0.58ms | -36.89% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.13ms |
| p99 | 0.13ms |
| mean | 0.11ms |
| stdev | 0.0079ms |
| min | 0.10ms |
| max | 0.13ms |
| total | 3.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.13ms | -0.02ms | -17.40% |
| p50 | 0.11ms | 0.14ms | -0.03ms | -20.04% |
| p95 | 0.13ms | 0.15ms | -0.03ms | -17.80% |
| p99 | 0.13ms | 0.16ms | -0.03ms | -18.77% |
| mean | 0.11ms | 0.14ms | -0.02ms | -18.07% |
| min | 0.10ms | 0.12ms | -0.02ms | -17.15% |
| max | 0.13ms | 0.16ms | -0.03ms | -18.32% |
| total | 3.34ms | 4.07ms | -0.74ms | -18.07% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.0093ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0084ms | -23.76% |
| p50 | 0.04ms | 0.04ms | -0.0012ms | -3.24% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -20.74% |
| p99 | 0.07ms | 0.07ms | -0.0080ms | -10.81% |
| mean | 0.04ms | 0.04ms | -0.0035ms | -8.78% |
| min | 0.03ms | 0.03ms | -0.0091ms | -26.13% |
| max | 0.07ms | 0.08ms | -0.0042ms | -5.43% |
| total | 1.09ms | 1.19ms | -0.10ms | -8.78% |

