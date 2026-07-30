# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createStore | 0.00025ms | 0.0033ms | 5ms | 0.00038ms | PASS | stable (検知には +0.00038ms (baseline 比 +180%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dispatch | 0.00033ms | 0.0016ms | 5ms | 0.00037ms | PASS | stable (検知には +0.00037ms (baseline 比 +126%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| selectState | 0.00021ms | 0.00097ms | 5ms | 0.00037ms | PASS | stable (検知には +0.00037ms (baseline 比 +180%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| createStore | cpu | 0.09ms | 0.14ms | 0.00025ms | 0.003 | 0.003 | 0.00023ms | 0.00021ms |
| dispatch | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | 0.00030ms | 0.00029ms |
| selectState | cpu | 0.09ms | 0.12ms | 0.00021ms | 0.002 | 0.003 | 0.00019ms | 0.00021ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.02ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | 234416 B | 0 B | 102400 B | yes | PASS |
| dispatch | -10640 B | 0 B | 102400 B | yes | PASS |
| selectState | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.0033ms |
| p99 | 0.0093ms |
| mean | 0.00094ms |
| stdev | 0.0022ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00023ms | 0.00021ms | +0.000017ms | +8.35% |
| p50 | 0.00026ms | 0.00025ms | +0.000012ms | +4.93% |
| p95 | 0.0030ms | 0.0021ms | +0.00086ms | +39.98% |
| p99 | 0.0084ms | 0.0072ms | +0.0012ms | +16.83% |
| mean | 0.00085ms | 0.00059ms | +0.00026ms | +45.09% |
| min | 0.00019ms | 0.00021ms | -0.000020ms | -9.85% |
| max | 0.02ms | 0.01ms | +0.0040ms | +29.75% |
| total | 0.17ms | 0.12ms | +0.05ms | +45.09% |

### dispatch

# Perf Report — dispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0016ms |
| p99 | 0.0043ms |
| mean | 0.00060ms |
| stdev | 0.0012ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.888)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00029ms | +0.0000036ms | +1.23% |
| p50 | 0.00033ms | 0.00033ms | -0.0000011ms | -0.34% |
| p95 | 0.0014ms | 0.00085ms | +0.00057ms | +66.95% |
| p99 | 0.0038ms | 0.0080ms | -0.0042ms | -52.50% |
| mean | 0.00054ms | 0.00059ms | -0.000054ms | -9.20% |
| min | 0.00030ms | 0.00029ms | +0.0000046ms | +1.58% |
| max | 0.01ms | 0.01ms | +0.0014ms | +12.02% |
| total | 0.11ms | 0.12ms | -0.01ms | -9.20% |

### selectState

# Perf Report — selectState.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00097ms |
| p99 | 0.01ms |
| mean | 0.0039ms |
| stdev | 0.05ms |
| min | 0.00021ms |
| max | 0.67ms |
| total | 0.78ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.901)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00019ms | 0.00021ms | -0.000021ms | -9.94% |
| p50 | 0.00023ms | 0.00021ms | +0.000017ms | +8.25% |
| p95 | 0.00087ms | 0.0011ms | -0.00021ms | -19.52% |
| p99 | 0.0098ms | 0.0053ms | +0.0046ms | +85.99% |
| mean | 0.0035ms | 0.00044ms | +0.0031ms | +694.14% |
| min | 0.00019ms | 0.00017ms | +0.000021ms | +12.85% |
| max | 0.60ms | 0.02ms | +0.59ms | +3708.72% |
| total | 0.71ms | 0.09ms | +0.62ms | +694.14% |

