# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendPush | 0.00042ms | 0.0019ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| sendSMS | 0.00046ms | 0.0027ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +194% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00038ms | 0.0045ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +101% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| sendPush | cpu | 0.09ms | 0.09ms | 0.00042ms | 0.005 | 0.005 | n/a | 20.0% | 0.00039ms | 0.00042ms |
| sendSMS | cpu | 0.09ms | 0.09ms | 0.00046ms | 0.005 | 0.005 | n/a | 20.0% | 0.00043ms | 0.00042ms |
| parseNotificationEvent | cpu | 0.09ms | 0.11ms | 0.00038ms | 0.004 | 0.004 | n/a | 20.0% | 0.00035ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| sendPush | 27976 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| sendSMS | 22480 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| parseNotificationEvent | 1352 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0019ms |
| p99 | 0.01ms |
| mean | 0.00085ms |
| stdev | 0.0019ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.927)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00039ms | 0.00042ms | -0.000029ms | -7.08% |
| p50 | 0.00043ms | 0.00046ms | -0.000033ms | -7.10% |
| p95 | 0.0018ms | 0.0036ms | -0.0018ms | -50.04% |
| p99 | 0.01ms | 0.0082ms | +0.0020ms | +23.93% |
| mean | 0.00079ms | 0.00095ms | -0.00016ms | -16.65% |
| min | 0.00039ms | 0.00038ms | +0.000011ms | +2.83% |
| max | 0.02ms | 0.0097ms | +0.01ms | +104.98% |
| total | 0.16ms | 0.19ms | -0.03ms | -16.65% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0027ms |
| p99 | 0.01ms |
| mean | 0.00095ms |
| stdev | 0.0019ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.930)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00043ms | 0.00042ms | +0.0000097ms | +2.34% |
| p50 | 0.00046ms | 0.00042ms | +0.000048ms | +11.46% |
| p95 | 0.0025ms | 0.00085ms | +0.0016ms | +193.58% |
| p99 | 0.01ms | 0.0028ms | +0.0083ms | +290.74% |
| mean | 0.00088ms | 0.00057ms | +0.00031ms | +53.49% |
| min | 0.00039ms | 0.00038ms | +0.000012ms | +3.12% |
| max | 0.02ms | 0.01ms | +0.0032ms | +25.68% |
| total | 0.18ms | 0.11ms | +0.06ms | +53.49% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0045ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0028ms |
| min | 0.00033ms |
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00035ms | 0.00033ms | +0.000013ms | +3.92% |
| p50 | 0.00038ms | 0.00038ms | +0.0000089ms | +2.37% |
| p95 | 0.0041ms | 0.0021ms | +0.0021ms | +100.84% |
| p99 | 0.01ms | 0.01ms | -0.00070ms | -5.68% |
| mean | 0.0010ms | 0.00077ms | +0.00027ms | +35.61% |
| min | 0.00031ms | 0.00029ms | +0.000016ms | +5.60% |
| max | 0.03ms | 0.02ms | +0.0083ms | +47.25% |
| total | 0.21ms | 0.15ms | +0.05ms | +35.61% |

