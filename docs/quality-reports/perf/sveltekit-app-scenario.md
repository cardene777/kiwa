# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0064ms | 0.0082ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.11ms | 0.23ms | 100ms | 0.00047ms | PASS | stable (換算後 p10 +18% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.01ms | 0.04ms | 100ms | 0.00047ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +132% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | cpu | 0.09ms | 0.10ms | 0.0064ms | 0.075 | 0.072 | 0.0063ms | 0.0060ms |
| form_action_batch (5 invokeAction with FormData) | cpu | 0.09ms | 0.11ms | 0.11ms | 1.306 | 1.102 | 0.11ms | 0.09ms |
| load_error_handling (5 throw + catch) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.151 | 0.149 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.88ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | -4968 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 65928 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | -6344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0064ms |
| p50 | 0.0067ms |
| p95 | 0.0082ms |
| p99 | 0.0091ms |
| mean | 0.0071ms |
| stdev | 0.00076ms |
| min | 0.0063ms |
| max | 0.0093ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.980)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0060ms | +0.00031ms | +5.24% |
| p50 | 0.0066ms | 0.0064ms | +0.00026ms | +4.06% |
| p95 | 0.0080ms | 0.0073ms | +0.00074ms | +10.15% |
| p99 | 0.0089ms | 0.0077ms | +0.0012ms | +15.49% |
| mean | 0.0069ms | 0.0065ms | +0.00043ms | +6.64% |
| min | 0.0062ms | 0.0060ms | +0.00020ms | +3.39% |
| max | 0.0091ms | 0.0078ms | +0.0013ms | +16.73% |
| total | 0.14ms | 0.13ms | +0.0086ms | +6.64% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.13ms |
| p95 | 0.23ms |
| p99 | 0.30ms |
| mean | 0.15ms |
| stdev | 0.05ms |
| min | 0.11ms |
| max | 0.31ms |
| total | 2.99ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.935)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.09ms | +0.02ms | +18.49% |
| p50 | 0.13ms | 0.10ms | +0.02ms | +24.03% |
| p95 | 0.22ms | 0.17ms | +0.04ms | +23.49% |
| p99 | 0.28ms | 0.22ms | +0.06ms | +27.85% |
| mean | 0.14ms | 0.12ms | +0.02ms | +21.20% |
| min | 0.10ms | 0.09ms | +0.01ms | +13.19% |
| max | 0.29ms | 0.23ms | +0.07ms | +28.69% |
| total | 2.80ms | 2.31ms | +0.49ms | +21.20% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 0.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.940)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00010ms | +0.86% |
| p50 | 0.01ms | 0.01ms | -0.00015ms | -1.21% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +131.71% |
| p99 | 0.06ms | 0.02ms | +0.04ms | +240.07% |
| mean | 0.02ms | 0.01ms | +0.0042ms | +31.55% |
| min | 0.01ms | 0.01ms | +0.00036ms | +3.06% |
| max | 0.07ms | 0.02ms | +0.05ms | +261.74% |
| total | 0.35ms | 0.26ms | +0.08ms | +31.55% |

