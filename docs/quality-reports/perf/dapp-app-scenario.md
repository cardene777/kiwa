# Perf Suite — dapp-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.03ms | 0.07ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 0.12ms | 0.16ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.04ms | 0.11ms | 30ms | 0.00045ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | cpu | 0.10ms | 0.11ms | 0.03ms | 0.267 | 0.268 | n/a | 20.0% | 0.03ms | 0.03ms |
| bulk_dapp_spec_parse (50 parseSpec rapid) | cpu | 0.09ms | 0.10ms | 0.12ms | 1.305 | 1.303 | n/a | 20.0% | 0.12ms | 0.12ms |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | cpu | 0.09ms | 0.12ms | 0.04ms | 0.439 | 0.274 | n/a | 20.0% | 0.04ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | 0.12ms | 60ms | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 1.40ms | 100ms | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | 0.31ms | 60ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| dapp_spec_parse (10 parseSpec of wallet spec) | -46496 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| bulk_dapp_spec_parse (50 parseSpec rapid) | 7544 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| dapp_spec_with_module_override (10 parseSpec with opts.module) | -472 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### dapp_spec_parse (10 parseSpec of wallet spec)

# Perf Report — dapp_spec_parse (10 parseSpec of wallet spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.09ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 1.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.986)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00012ms | -0.47% |
| p50 | 0.04ms | 0.04ms | -0.0049ms | -12.06% |
| p95 | 0.07ms | 0.06ms | +0.0090ms | +15.96% |
| p99 | 0.08ms | 0.06ms | +0.02ms | +41.31% |
| mean | 0.04ms | 0.04ms | -0.00052ms | -1.31% |
| min | 0.02ms | 0.02ms | -0.00011ms | -0.45% |
| max | 0.09ms | 0.06ms | +0.03ms | +48.77% |
| total | 1.17ms | 1.19ms | -0.02ms | -1.31% |

### bulk_dapp_spec_parse (50 parseSpec rapid)

# Perf Report — bulk_dapp_spec_parse (50 parseSpec rapid).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.12ms |
| p50 | 0.13ms |
| p95 | 0.16ms |
| p99 | 0.46ms |
| mean | 0.15ms |
| stdev | 0.08ms |
| min | 0.12ms |
| max | 0.58ms |
| total | 4.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.999)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.12ms | +0.00019ms | +0.15% |
| p50 | 0.13ms | 0.12ms | +0.0034ms | +2.81% |
| p95 | 0.16ms | 0.14ms | +0.02ms | +14.18% |
| p99 | 0.46ms | 0.15ms | +0.31ms | +198.68% |
| mean | 0.14ms | 0.13ms | +0.02ms | +14.10% |
| min | 0.12ms | 0.12ms | +0.0013ms | +1.08% |
| max | 0.58ms | 0.16ms | +0.43ms | +270.50% |
| total | 4.35ms | 3.81ms | +0.54ms | +14.10% |

### dapp_spec_with_module_override (10 parseSpec with opts.module)

# Perf Report — dapp_spec_with_module_override (10 parseSpec with opts.module).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.11ms |
| p99 | 0.15ms |
| mean | 0.06ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.15ms |
| total | 1.76ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.901)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.02ms | +0.01ms | +59.94% |
| p50 | 0.04ms | 0.02ms | +0.01ms | +55.58% |
| p95 | 0.10ms | 0.26ms | -0.15ms | -60.45% |
| p99 | 0.13ms | 0.81ms | -0.68ms | -83.84% |
| mean | 0.05ms | 0.10ms | -0.05ms | -46.14% |
| min | 0.04ms | 0.02ms | +0.01ms | +58.33% |
| max | 0.14ms | 1.02ms | -0.88ms | -86.39% |
| total | 1.58ms | 2.94ms | -1.35ms | -46.14% |

