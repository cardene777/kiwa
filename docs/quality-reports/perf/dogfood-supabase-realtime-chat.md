# Perf Suite — dogfood-supabase-realtime-chat

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| joinRoom | 3.44ms | 3.95ms | 50ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendMessage | 3.14ms | 5.82ms | 30ms | 0.00039ms | PASS | stable (換算後 p10 -6% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| getPresence | 0.00054ms | 0.02ms | 30ms | 0.00038ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +372% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sendTyping | 3.14ms | 6.53ms | 100ms | 0.00038ms | PASS | stable (換算後 p10 -17% (閾値未満)、 p95 +70% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| joinRoom | cpu | 0.09ms | 0.19ms | 3.44ms | 38.429 | 40.560 | 3.18ms | 3.35ms |
| sendMessage | cpu | 0.09ms | 0.86ms | 3.14ms | 35.915 | 38.316 | 2.94ms | 3.13ms |
| getPresence | cpu | 0.09ms | 0.15ms | 0.00054ms | 0.006 | 0.006 | 0.00049ms | 0.00046ms |
| sendTyping | cpu | 0.09ms | 0.40ms | 3.14ms | 34.945 | 42.057 | 2.85ms | 3.43ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinRoom | 4.13ms | 100ms | PASS |
| sendMessage | 5.28ms | 60ms | PASS |
| getPresence | 0.01ms | 60ms | PASS |
| sendTyping | 7.79ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| joinRoom | 65864 B | 0 B | 102400 B | yes | PASS |
| sendMessage | 36624 B | 0 B | 102400 B | yes | PASS |
| getPresence | 38712 B | 0 B | 102400 B | yes | PASS |
| sendTyping | 39800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### joinRoom

# Perf Report — joinRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.44ms |
| p50 | 3.51ms |
| p95 | 3.95ms |
| p99 | 4.84ms |
| mean | 3.57ms |
| stdev | 0.33ms |
| min | 2.86ms |
| max | 5.11ms |
| total | 142.99ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 3.18ms | 3.35ms | -0.18ms | -5.25% |
| p50 | 3.24ms | 3.53ms | -0.29ms | -8.22% |
| p95 | 3.65ms | 3.89ms | -0.24ms | -6.13% |
| p99 | 4.46ms | 4.23ms | +0.23ms | +5.41% |
| mean | 3.30ms | 3.53ms | -0.23ms | -6.46% |
| min | 2.64ms | 2.48ms | +0.17ms | +6.70% |
| max | 4.71ms | 4.45ms | +0.26ms | +5.82% |
| total | 132.01ms | 141.13ms | -9.11ms | -6.46% |

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.14ms |
| p50 | 3.64ms |
| p95 | 5.82ms |
| p99 | 7.17ms |
| mean | 4.00ms |
| stdev | 1.04ms |
| min | 2.57ms |
| max | 7.24ms |
| total | 160.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.934)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.94ms | 3.13ms | -0.20ms | -6.27% |
| p50 | 3.40ms | 3.45ms | -0.05ms | -1.36% |
| p95 | 5.43ms | 3.49ms | +1.95ms | +55.86% |
| p99 | 6.70ms | 3.50ms | +3.20ms | +91.41% |
| mean | 3.74ms | 3.39ms | +0.35ms | +10.34% |
| min | 2.40ms | 3.08ms | -0.68ms | -22.17% |
| max | 6.76ms | 3.50ms | +3.26ms | +93.07% |
| total | 149.58ms | 135.57ms | +14.02ms | +10.34% |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.0014ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.0066ms |
| stdev | 0.01ms |
| min | 0.00050ms |
| max | 0.06ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.905)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00049ms | 0.00046ms | +0.000032ms | +7.08% |
| p50 | 0.0013ms | 0.00046ms | +0.00082ms | +179.33% |
| p95 | 0.02ms | 0.0043ms | +0.02ms | +371.93% |
| p99 | 0.06ms | 0.01ms | +0.04ms | +411.60% |
| mean | 0.0059ms | 0.0012ms | +0.0048ms | +409.69% |
| min | 0.00045ms | 0.00042ms | +0.000036ms | +8.75% |
| max | 0.06ms | 0.01ms | +0.04ms | +295.21% |
| total | 0.24ms | 0.05ms | +0.19ms | +409.69% |

### sendTyping

# Perf Report — sendTyping.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 3.14ms |
| p50 | 3.81ms |
| p95 | 6.53ms |
| p99 | 8.14ms |
| mean | 4.19ms |
| stdev | 1.20ms |
| min | 2.80ms |
| max | 8.94ms |
| total | 167.66ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.907)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.85ms | 3.43ms | -0.58ms | -16.91% |
| p50 | 3.46ms | 3.44ms | +0.02ms | +0.47% |
| p95 | 5.92ms | 3.48ms | +2.45ms | +70.43% |
| p99 | 7.39ms | 3.48ms | +3.90ms | +111.95% |
| mean | 3.80ms | 3.41ms | +0.39ms | +11.44% |
| min | 2.54ms | 2.29ms | +0.24ms | +10.56% |
| max | 8.11ms | 3.49ms | +4.62ms | +132.53% |
| total | 152.09ms | 136.48ms | +15.61ms | +11.44% |

