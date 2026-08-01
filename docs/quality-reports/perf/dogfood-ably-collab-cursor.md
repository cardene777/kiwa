# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinBoard | 0.0015ms | 0.01ms | 50ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| moveCursor | 10.27ms | 11.76ms | 100ms | 0.00039ms | PASS | stable — gate 無効 (regressionGate=false) |
| rewindHistory | 0.00079ms | 0.0096ms | 30ms | 0.00039ms | PASS | stable — gate 無効 (regressionGate=false) |
| getPresence | 0.00050ms | 0.0043ms | 30ms | 0.00039ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| joinBoard | cpu | 0.09ms | 0.10ms | 0.0015ms | 0.017 | 0.017 | n/a | 20.0% | 0.0014ms | 0.0014ms |
| moveCursor | cpu | 0.09ms | 0.14ms | 10.27ms | 118.753 | 127.633 | n/a | 20.0% | 9.69ms | 10.41ms |
| rewindHistory | cpu | 0.09ms | 0.09ms | 0.00079ms | 0.009 | 0.009 | n/a | 20.0% | 0.00074ms | 0.00075ms |
| getPresence | cpu | 0.09ms | 0.09ms | 0.00050ms | 0.006 | 0.006 | n/a | 20.0% | 0.00047ms | 0.00046ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.03ms | 100ms | PASS |
| moveCursor | 11.90ms | 200ms | PASS |
| rewindHistory | 0.01ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| joinBoard | 22344 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| moveCursor | 50848 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| rewindHistory | 31512 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| getPresence | 36176 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0023ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0042ms |
| stdev | 0.0057ms |
| min | 0.0015ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.912)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | -0.000011ms | -0.75% |
| p50 | 0.0021ms | 0.0023ms | -0.00020ms | -8.82% |
| p95 | 0.01ms | 0.01ms | -0.0023ms | -17.76% |
| p99 | 0.02ms | 0.03ms | -0.0029ms | -10.74% |
| mean | 0.0038ms | 0.0048ms | -0.0010ms | -21.09% |
| min | 0.0013ms | 0.0013ms | -0.0000043ms | -0.32% |
| max | 0.03ms | 0.03ms | -0.0030ms | -8.91% |
| total | 0.15ms | 0.19ms | -0.04ms | -21.09% |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 10.27ms |
| p50 | 11.42ms |
| p95 | 11.76ms |
| p99 | 12.02ms |
| mean | 11.21ms |
| stdev | 0.53ms |
| min | 9.82ms |
| max | 12.15ms |
| total | 448.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.944)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 9.69ms | 10.41ms | -0.72ms | -6.96% |
| p50 | 10.78ms | 11.41ms | -0.63ms | -5.54% |
| p95 | 11.10ms | 11.49ms | -0.39ms | -3.37% |
| p99 | 11.35ms | 11.55ms | -0.20ms | -1.74% |
| mean | 10.58ms | 11.21ms | -0.64ms | -5.69% |
| min | 9.27ms | 9.42ms | -0.16ms | -1.68% |
| max | 11.46ms | 11.56ms | -0.10ms | -0.83% |
| total | 423.05ms | 448.56ms | -25.51ms | -5.69% |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00094ms |
| p95 | 0.0096ms |
| p99 | 0.02ms |
| mean | 0.0025ms |
| stdev | 0.0037ms |
| min | 0.00075ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.939)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00074ms | 0.00075ms | -0.0000070ms | -0.94% |
| p50 | 0.00088ms | 0.00088ms | +0.0000056ms | +0.64% |
| p95 | 0.0090ms | 0.01ms | -0.0021ms | -18.52% |
| p99 | 0.01ms | 0.02ms | -0.0051ms | -26.16% |
| mean | 0.0024ms | 0.0027ms | -0.00036ms | -13.11% |
| min | 0.00070ms | 0.00071ms | -0.0000035ms | -0.50% |
| max | 0.02ms | 0.02ms | -0.0064ms | -26.41% |
| total | 0.09ms | 0.11ms | -0.01ms | -13.11% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0043ms |
| p99 | 0.0095ms |
| mean | 0.0012ms |
| stdev | 0.0020ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.944)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00047ms | 0.00046ms | +0.000014ms | +3.06% |
| p50 | 0.00047ms | 0.00054ms | -0.000070ms | -12.84% |
| p95 | 0.0041ms | 0.0041ms | -0.000035ms | -0.85% |
| p99 | 0.0089ms | 0.01ms | -0.0020ms | -18.48% |
| mean | 0.0011ms | 0.0013ms | -0.00012ms | -9.60% |
| min | 0.00043ms | 0.00046ms | -0.000026ms | -5.60% |
| max | 0.01ms | 0.01ms | -0.0017ms | -13.77% |
| total | 0.05ms | 0.05ms | -0.0048ms | -9.60% |

