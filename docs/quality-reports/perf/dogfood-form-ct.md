# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.05ms | 0.14ms | 50ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.07ms | 80ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.13ms | 80ms | 0.00038ms | PASS | improved — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.06ms | 0.32ms | 80ms | 0.00041ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +180% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| mountAllForms | cpu | 0.09ms | 0.10ms | 0.05ms | 0.577 | 0.578 | 0.05ms | 0.05ms |
| validateAllForms | cpu | 0.09ms | 0.10ms | 0.04ms | 0.431 | 0.442 | 0.04ms | 0.04ms |
| submitAllForms | cpu | 0.09ms | 0.12ms | 0.03ms | 0.336 | 0.633 | 0.03ms | 0.05ms |
| a11yAllForms | cpu | 0.08ms | 0.13ms | 0.06ms | 0.746 | 0.700 | 0.06ms | 0.06ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 0.97ms | 100ms | PASS |
| validateAllForms | 0.93ms | 160ms | PASS |
| submitAllForms | 0.95ms | 160ms | PASS |
| a11yAllForms | 1.37ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mountAllForms | 7464 B | 0 B | 102400 B | yes | PASS |
| validateAllForms | -60368 B | 0 B | 102400 B | yes | PASS |
| submitAllForms | -7736 B | 0 B | 102400 B | yes | PASS |
| a11yAllForms | -4280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.14ms |
| p99 | 0.29ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.05ms |
| max | 0.38ms |
| total | 3.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.979)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.000094ms | -0.19% |
| p50 | 0.07ms | 0.07ms | +0.0022ms | +3.31% |
| p95 | 0.14ms | 0.13ms | +0.01ms | +9.37% |
| p99 | 0.29ms | 0.26ms | +0.03ms | +11.88% |
| mean | 0.08ms | 0.08ms | +0.0032ms | +4.09% |
| min | 0.05ms | 0.05ms | -0.0014ms | -2.90% |
| max | 0.38ms | 0.32ms | +0.05ms | +15.87% |
| total | 3.27ms | 3.15ms | +0.13ms | +4.09% |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.13ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.16ms |
| total | 1.90ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00086ms | -2.34% |
| p50 | 0.04ms | 0.04ms | -0.00091ms | -2.40% |
| p95 | 0.06ms | 0.06ms | -0.00026ms | -0.43% |
| p99 | 0.12ms | 2.25ms | -2.13ms | -94.85% |
| mean | 0.04ms | 0.13ms | -0.09ms | -66.78% |
| min | 0.04ms | 0.04ms | -0.00057ms | -1.58% |
| max | 0.15ms | 3.65ms | -3.50ms | -95.87% |
| total | 1.75ms | 5.28ms | -3.53ms | -66.78% |

### submitAllForms

# Perf Report — submitAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.13ms |
| p99 | 0.24ms |
| mean | 0.05ms |
| stdev | 0.05ms |
| min | 0.03ms |
| max | 0.28ms |
| total | 1.95ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.05ms | -0.02ms | -46.92% |
| p50 | 0.03ms | 0.06ms | -0.03ms | -46.10% |
| p95 | 0.12ms | 0.38ms | -0.26ms | -69.24% |
| p99 | 0.22ms | 0.50ms | -0.28ms | -55.38% |
| mean | 0.04ms | 0.11ms | -0.06ms | -58.42% |
| min | 0.03ms | 0.05ms | -0.02ms | -46.46% |
| max | 0.26ms | 0.56ms | -0.30ms | -53.38% |
| total | 1.80ms | 4.32ms | -2.53ms | -58.42% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.08ms |
| p95 | 0.32ms |
| p99 | 0.54ms |
| mean | 0.12ms |
| stdev | 0.11ms |
| min | 0.06ms |
| max | 0.61ms |
| total | 4.95ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.975)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | +0.0038ms | +6.60% |
| p50 | 0.08ms | 0.06ms | +0.01ms | +23.18% |
| p95 | 0.32ms | 0.11ms | +0.20ms | +180.08% |
| p99 | 0.52ms | 0.21ms | +0.31ms | +151.90% |
| mean | 0.12ms | 0.07ms | +0.05ms | +67.35% |
| min | 0.06ms | 0.06ms | +0.0044ms | +7.84% |
| max | 0.60ms | 0.22ms | +0.38ms | +168.27% |
| total | 4.82ms | 2.88ms | +1.94ms | +67.35% |

