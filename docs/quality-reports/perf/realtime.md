# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0013ms | 0.0081ms | 20ms | 0.00031ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +54% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00033ms | 0.00097ms | 20ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +104%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.0034ms | 20ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +183%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00033ms | 0.00072ms | 20ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| supabasePresenceTrack | cpu | 0.09ms | 0.10ms | 0.0013ms | 0.014 | 0.014 | n/a | 20.0% | 0.0012ms | 0.0011ms |
| ablyPublish | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00030ms | 0.00029ms |
| pusherSubscribeChannel | cpu | 0.09ms | 0.15ms | 0.00017ms | 0.002 | 0.002 | n/a | 20.0% | 0.00015ms | 0.00017ms |
| socketioEmit | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00031ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.03ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.00ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | -31208 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| ablyPublish | 28528 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| pusherSubscribeChannel | 2680 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| socketioEmit | 53312 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0081ms |
| p99 | 0.03ms |
| mean | 0.0028ms |
| stdev | 0.0044ms |
| min | 0.0012ms |
| max | 0.04ms |
| total | 0.56ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.922)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0011ms | +0.000027ms | +2.43% |
| p50 | 0.0013ms | 0.0013ms | +0.000018ms | +1.41% |
| p95 | 0.0075ms | 0.0048ms | +0.0026ms | +54.02% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +98.81% |
| mean | 0.0026ms | 0.0020ms | +0.00060ms | +30.34% |
| min | 0.0011ms | 0.0010ms | +0.000072ms | +6.88% |
| max | 0.03ms | 0.02ms | +0.02ms | +83.33% |
| total | 0.51ms | 0.39ms | +0.12ms | +30.34% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00097ms |
| p99 | 0.0050ms |
| mean | 0.00054ms |
| stdev | 0.00080ms |
| min | 0.00033ms |
| max | 0.0069ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.912)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00029ms | +0.000012ms | +4.06% |
| p50 | 0.00034ms | 0.00038ms | -0.000033ms | -8.75% |
| p95 | 0.00088ms | 0.00077ms | +0.00012ms | +15.01% |
| p99 | 0.0046ms | 0.0045ms | +0.00011ms | +2.34% |
| mean | 0.00049ms | 0.00056ms | -0.000066ms | -11.77% |
| min | 0.00030ms | 0.00029ms | +0.000013ms | +4.42% |
| max | 0.0063ms | 0.01ms | -0.0053ms | -45.52% |
| total | 0.10ms | 0.11ms | -0.01ms | -11.77% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.0034ms |
| p99 | 0.0055ms |
| mean | 0.00067ms |
| stdev | 0.0015ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00015ms | 0.00017ms | -0.000014ms | -8.41% |
| p50 | 0.00019ms | 0.00017ms | +0.000023ms | +14.07% |
| p95 | 0.0031ms | 0.0034ms | -0.00023ms | -6.98% |
| p99 | 0.0050ms | 0.01ms | -0.0058ms | -53.57% |
| mean | 0.00061ms | 0.00086ms | -0.00025ms | -28.91% |
| min | 0.00015ms | 0.00013ms | +0.000027ms | +21.63% |
| max | 0.01ms | 0.03ms | -0.02ms | -55.48% |
| total | 0.12ms | 0.17ms | -0.05ms | -28.91% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00072ms |
| p99 | 0.0028ms |
| mean | 0.0012ms |
| stdev | 0.01ms |
| min | 0.00033ms |
| max | 0.16ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.919)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00031ms | 0.00033ms | -0.000027ms | -8.07% |
| p50 | 0.00034ms | 0.00038ms | -0.000030ms | -8.07% |
| p95 | 0.00066ms | 0.0091ms | -0.0085ms | -92.74% |
| p99 | 0.0025ms | 0.02ms | -0.01ms | -84.81% |
| mean | 0.0011ms | 0.0017ms | -0.00060ms | -34.79% |
| min | 0.00031ms | 0.00029ms | +0.000015ms | +5.20% |
| max | 0.14ms | 0.04ms | +0.10ms | +246.09% |
| total | 0.23ms | 0.35ms | -0.12ms | -34.79% |

