# Perf Suite — realtime

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| supabasePresenceTrack | 0.0011ms | 0.0039ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| ablyPublish | 0.00029ms | 0.00059ms | 20ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +115%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| pusherSubscribeChannel | 0.00017ms | 0.00038ms | 20ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +275%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| socketioEmit | 0.00033ms | 0.00088ms | 20ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +116%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| supabasePresenceTrack | cpu | 0.08ms | 0.0011ms | 0.014 | 0.014 | 0.0011ms | 0.0011ms |
| ablyPublish | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00030ms | 0.00029ms |
| pusherSubscribeChannel | cpu | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00017ms | 0.00013ms |
| socketioEmit | cpu | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00034ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| supabasePresenceTrack | 0.02ms | 40ms | PASS |
| ablyPublish | 0.01ms | 40ms | PASS |
| pusherSubscribeChannel | 0.00ms | 40ms | PASS |
| socketioEmit | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| supabasePresenceTrack | -24216 B | 0 B | 102400 B | yes | PASS |
| ablyPublish | 28784 B | 0 B | 102400 B | yes | PASS |
| pusherSubscribeChannel | 2680 B | 0 B | 102400 B | yes | PASS |
| socketioEmit | 45776 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### supabasePresenceTrack

# Perf Report — supabasePresenceTrack.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0013ms |
| p95 | 0.0039ms |
| p99 | 0.01ms |
| mean | 0.0019ms |
| stdev | 0.0019ms |
| min | 0.0010ms |
| max | 0.02ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0011ms | 0.00ms | 0.00% |
| p50 | 0.0013ms | 0.0013ms | 0.00ms | 0.00% |
| p95 | 0.0039ms | 0.0055ms | -0.0016ms | -28.98% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -59.68% |
| mean | 0.0019ms | 0.0024ms | -0.00052ms | -21.98% |
| min | 0.0010ms | 0.0011ms | -0.000083ms | -7.66% |
| max | 0.02ms | 0.04ms | -0.02ms | -55.80% |
| total | 0.37ms | 0.48ms | -0.10ms | -21.98% |

### ablyPublish

# Perf Report — ablyPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00059ms |
| p99 | 0.0022ms |
| mean | 0.00040ms |
| stdev | 0.00034ms |
| min | 0.00029ms |
| max | 0.0037ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.00059ms | 0.00092ms | -0.00033ms | -36.11% |
| p99 | 0.0022ms | 0.0045ms | -0.0023ms | -51.50% |
| mean | 0.00040ms | 0.00051ms | -0.00011ms | -21.65% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0037ms | 0.0069ms | -0.0032ms | -46.66% |
| total | 0.08ms | 0.10ms | -0.02ms | -21.65% |

### pusherSubscribeChannel

# Perf Report — pusherSubscribeChannel.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00038ms |
| p99 | 0.0027ms |
| mean | 0.00033ms |
| stdev | 0.0013ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00013ms | +0.000041ms | +32.80% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00076ms | -0.00039ms | -50.68% |
| p99 | 0.0027ms | 0.0040ms | -0.0013ms | -33.32% |
| mean | 0.00033ms | 0.00040ms | -0.000073ms | -18.13% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0021ms | -11.20% |
| total | 0.07ms | 0.08ms | -0.01ms | -18.13% |

### socketioEmit

# Perf Report — socketioEmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00033ms |
| p95 | 0.00088ms |
| p99 | 0.0054ms |
| mean | 0.00054ms |
| stdev | 0.0012ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00029ms | +0.000041ms | +14.04% |
| p50 | 0.00033ms | 0.00033ms | +0.0000010ms | +0.30% |
| p95 | 0.00088ms | 0.00080ms | +0.000085ms | +10.69% |
| p99 | 0.0054ms | 0.0073ms | -0.0019ms | -26.20% |
| mean | 0.00054ms | 0.00053ms | +0.000012ms | +2.37% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00025ms | -1.77% |
| total | 0.11ms | 0.11ms | +0.0025ms | +2.37% |

