# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.02ms | 0.04ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.11ms | 0.14ms | 50ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.03ms | 0.05ms | 30ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.277 | 0.268 | 0.03ms | 0.03ms |
| bulk_dapp_spec_parse (50 parseSpec rapid) | cpu | 0.09ms | 0.09ms | 0.11ms | 1.288 | 1.303 | 0.12ms | 0.12ms |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | cpu | 0.09ms | 0.10ms | 0.03ms | 0.312 | 0.274 | 0.03ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.11ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.76ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.16ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -33024 B | 0 B | 102400 B | yes | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | -18264 B | 0 B | 102400 B | yes | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 3336 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 1.02ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.167)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00086ms | +3.40% |
| p50 | 0.04ms | 0.04ms | -0.0032ms | -7.83% |
| p95 | 0.05ms | 0.06ms | -0.0049ms | -8.74% |
| p99 | 0.08ms | 0.06ms | +0.02ms | +33.44% |
| mean | 0.04ms | 0.04ms | -0.000029ms | -0.07% |
| min | 0.03ms | 0.02ms | +0.00021ms | +0.83% |
| max | 0.09ms | 0.06ms | +0.03ms | +51.28% |
| total | 1.19ms | 1.19ms | -0.00086ms | -0.07% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.12ms |
| p95 | 0.14ms |
| p99 | 0.14ms |
| mean | 0.12ms |
| stdev | 0.01ms |
| min | 0.11ms |
| max | 0.15ms |
| total | 3.60ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.077)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.12ms | -0.0014ms | -1.17% |
| p50 | 0.13ms | 0.12ms | +0.0031ms | +2.56% |
| p95 | 0.15ms | 0.14ms | +0.01ms | +7.19% |
| p99 | 0.16ms | 0.15ms | +0.0011ms | +0.72% |
| mean | 0.13ms | 0.13ms | +0.0021ms | +1.67% |
| min | 0.12ms | 0.12ms | -0.00043ms | -0.36% |
| max | 0.16ms | 0.16ms | -0.00056ms | -0.35% |
| total | 3.87ms | 3.81ms | +0.06ms | +1.67% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0070ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 1.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.897)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0032ms | +13.77% |
| p50 | 0.04ms | 0.02ms | +0.01ms | +44.95% |
| p95 | 0.04ms | 0.26ms | -0.21ms | -83.46% |
| p99 | 0.05ms | 0.81ms | -0.76ms | -93.88% |
| mean | 0.03ms | 0.10ms | -0.06ms | -65.30% |
| min | 0.03ms | 0.02ms | +0.0028ms | +12.12% |
| max | 0.05ms | 1.02ms | -0.97ms | -94.97% |
| total | 1.02ms | 2.94ms | -1.92ms | -65.30% |

