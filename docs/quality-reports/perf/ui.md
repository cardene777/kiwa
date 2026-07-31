# Perf Suite — ui

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 0.19ms | 0.37ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| setupComponentEnvRender | 0.16ms | 0.47ms | 30ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| setupComponentEnvSnapshot | cpu | 0.08ms | 0.09ms | 0.19ms | 2.340 | 2.322 | 0.19ms | 0.19ms |
| setupComponentEnvRender | cpu | 0.08ms | 0.10ms | 0.16ms | 2.020 | 1.649 | 0.16ms | 0.13ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| setupComponentEnvSnapshot | 2.86ms | 60ms | PASS |
| setupComponentEnvRender | 1.50ms | 60ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| setupComponentEnvSnapshot | 5216 B | -935 B | 102400 B | yes | PASS |
| setupComponentEnvRender | 13936 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### setupComponentEnvSnapshot

# Perf Report — setupComponentEnvSnapshot.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.19ms |
| p50 | 0.23ms |
| p95 | 0.37ms |
| p99 | 0.55ms |
| mean | 0.25ms |
| stdev | 0.08ms |
| min | 0.18ms |
| max | 0.55ms |
| total | 12.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.999)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.19ms | +0.0014ms | +0.74% |
| p50 | 0.23ms | 0.22ms | +0.0057ms | +2.58% |
| p95 | 0.37ms | 0.47ms | -0.10ms | -21.84% |
| p99 | 0.55ms | 0.55ms | +0.0066ms | +1.20% |
| mean | 0.25ms | 0.25ms | -0.0020ms | -0.78% |
| min | 0.18ms | 0.17ms | +0.0019ms | +1.08% |
| max | 0.55ms | 0.55ms | +0.0037ms | +0.67% |
| total | 12.48ms | 12.58ms | -0.10ms | -0.78% |

### setupComponentEnvRender

# Perf Report — setupComponentEnvRender.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 3 |
| p10 | 0.16ms |
| p50 | 0.19ms |
| p95 | 0.47ms |
| p99 | 0.92ms |
| mean | 0.24ms |
| stdev | 0.16ms |
| min | 0.15ms |
| max | 0.99ms |
| total | 12.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.16ms | 0.13ms | +0.03ms | +22.49% |
| p50 | 0.19ms | 0.16ms | +0.03ms | +20.74% |
| p95 | 0.47ms | 0.30ms | +0.17ms | +56.29% |
| p99 | 0.91ms | 0.37ms | +0.54ms | +148.78% |
| mean | 0.24ms | 0.18ms | +0.06ms | +33.69% |
| min | 0.15ms | 0.13ms | +0.02ms | +19.10% |
| max | 0.98ms | 0.39ms | +0.59ms | +149.30% |
| total | 12.03ms | 9.00ms | +3.03ms | +33.69% |

