# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0060ms | 0.0067ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.10ms | 0.14ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | cpu | 0.08ms | 0.0060ms | 0.074 | 0.073 | 0.0061ms | 0.0060ms |
| form_action_batch (5 invokeAction with FormData) | cpu | 0.08ms | 0.10ms | 1.214 | 1.085 | 0.10ms | 0.09ms |
| load_error_handling (5 throw + catch) | cpu | 0.08ms | 0.01ms | 0.171 | 0.154 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.03ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.84ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 6464 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 53104 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0061ms |
| p95 | 0.0067ms |
| p99 | 0.0073ms |
| mean | 0.0062ms |
| stdev | 0.00036ms |
| min | 0.0058ms |
| max | 0.0074ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0060ms | 0.00ms | 0.00% |
| p50 | 0.0061ms | 0.0061ms | +0.000062ms | +1.02% |
| p95 | 0.0067ms | 0.0067ms | +0.000015ms | +0.22% |
| p99 | 0.0073ms | 0.0070ms | +0.00024ms | +3.36% |
| mean | 0.0062ms | 0.0062ms | +0.000061ms | +0.98% |
| min | 0.0058ms | 0.0059ms | -0.000083ms | -1.41% |
| max | 0.0074ms | 0.0071ms | +0.00029ms | +4.10% |
| total | 0.12ms | 0.12ms | +0.0012ms | +0.98% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.14ms |
| p99 | 0.17ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.10ms |
| max | 0.17ms |
| total | 2.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.0086ms | +9.57% |
| p50 | 0.11ms | 0.10ms | +0.0052ms | +5.17% |
| p95 | 0.14ms | 0.14ms | -0.0036ms | -2.59% |
| p99 | 0.17ms | 0.17ms | -0.0055ms | -3.20% |
| mean | 0.11ms | 0.11ms | +0.0067ms | +6.28% |
| min | 0.10ms | 0.09ms | +0.0075ms | +8.44% |
| max | 0.17ms | 0.18ms | -0.0060ms | -3.32% |
| total | 2.28ms | 2.15ms | +0.13ms | +6.28% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0018ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0011ms | +8.87% |
| p50 | 0.01ms | 0.01ms | +0.0014ms | +10.32% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -55.15% |
| p99 | 0.02ms | 0.12ms | -0.10ms | -83.24% |
| mean | 0.02ms | 0.02ms | -0.0057ms | -27.16% |
| min | 0.01ms | 0.01ms | +0.00083ms | +6.62% |
| max | 0.02ms | 0.14ms | -0.12ms | -85.36% |
| total | 0.31ms | 0.42ms | -0.11ms | -27.16% |

