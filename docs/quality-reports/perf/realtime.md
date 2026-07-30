# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0013ms | 0.01ms | 20ms | 0.00032ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +116% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00033ms | 0.0012ms | 20ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +109%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.0017ms | 20ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +191%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00033ms | 0.0032ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| supabasePresenceTrack | cpu | 0.09ms | 0.10ms | 0.0013ms | 0.015 | 0.014 | 0.0012ms | 0.0011ms |
| ablyPublish | cpu | 0.09ms | 0.10ms | 0.00033ms | 0.004 | 0.004 | 0.00032ms | 0.00029ms |
| pusherSubscribeChannel | cpu | 0.09ms | 0.11ms | 0.00017ms | 0.002 | 0.002 | 0.00016ms | 0.00017ms |
| socketioEmit | cpu | 0.08ms | 0.10ms | 0.00033ms | 0.004 | 0.004 | 0.00033ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.03ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.00ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| supabasePresenceTrack | -25160 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 28352 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 267000 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 45776 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0015ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0029ms |
| stdev | 0.0042ms |
| min | 0.0012ms |
| max | 0.03ms |
| total | 0.58ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.961)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0011ms | +0.000076ms | +6.77% |
| p50 | 0.0014ms | 0.0013ms | +0.00019ms | +15.32% |
| p95 | 0.01ms | 0.0048ms | +0.0056ms | +116.38% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +74.49% |
| mean | 0.0028ms | 0.0020ms | +0.00083ms | +41.88% |
| min | 0.0011ms | 0.0010ms | +0.000078ms | +7.53% |
| max | 0.03ms | 0.02ms | +0.0083ms | +45.34% |
| total | 0.56ms | 0.39ms | +0.17ms | +41.88% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0012ms |
| p99 | 0.0068ms |
| mean | 0.00060ms |
| stdev | 0.0010ms |
| min | 0.00029ms |
| max | 0.0079ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.956)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00032ms | 0.00029ms | +0.000026ms | +9.06% |
| p50 | 0.00036ms | 0.00038ms | -0.000016ms | -4.37% |
| p95 | 0.0012ms | 0.00077ms | +0.00039ms | +50.69% |
| p99 | 0.0065ms | 0.0045ms | +0.0020ms | +44.43% |
| mean | 0.00057ms | 0.00056ms | +0.0000084ms | +1.50% |
| min | 0.00028ms | 0.00029ms | -0.000012ms | -4.04% |
| max | 0.0075ms | 0.01ms | -0.0041ms | -34.99% |
| total | 0.11ms | 0.11ms | +0.0017ms | +1.50% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.0017ms |
| p99 | 0.0046ms |
| mean | 0.00046ms |
| stdev | 0.0014ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.956)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00016ms | 0.00017ms | -0.0000073ms | -4.39% |
| p50 | 0.00020ms | 0.00017ms | +0.000032ms | +19.08% |
| p95 | 0.0016ms | 0.0034ms | -0.0018ms | -52.54% |
| p99 | 0.0044ms | 0.01ms | -0.0064ms | -59.02% |
| mean | 0.00044ms | 0.00086ms | -0.00042ms | -49.08% |
| min | 0.00012ms | 0.00013ms | -0.0000055ms | -4.39% |
| max | 0.02ms | 0.03ms | -0.01ms | -45.53% |
| total | 0.09ms | 0.17ms | -0.08ms | -49.08% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0032ms |
| p99 | 0.0097ms |
| mean | 0.00083ms |
| stdev | 0.0016ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -0.0000061ms | -1.84% |
| p50 | 0.00037ms | 0.00038ms | -0.0000069ms | -1.84% |
| p95 | 0.0032ms | 0.0091ms | -0.0060ms | -65.48% |
| p99 | 0.0095ms | 0.02ms | -0.0071ms | -42.79% |
| mean | 0.00082ms | 0.0017ms | -0.00092ms | -53.00% |
| min | 0.00029ms | 0.00029ms | -0.0000054ms | -1.84% |
| max | 0.01ms | 0.04ms | -0.03ms | -72.24% |
| total | 0.16ms | 0.35ms | -0.18ms | -53.00% |

