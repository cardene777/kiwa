# Perf Suite — mcp

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mcpListTools | 0.00067ms | 0.01ms | 10ms | 0.00037ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +81% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mcpCallEcho | 0.0011ms | 0.02ms | 10ms | 0.00036ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +397% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mcpCallCalc | 0.0015ms | 0.0044ms | 10ms | 0.00036ms | PASS | stable (換算後 p10 +6% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| toolRegistryRegister | 0.00029ms | 0.00055ms | 5ms | 0.00036ms | PASS | stable (検知には +0.00036ms (baseline 比 +144%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| mcpListTools | cpu | 0.09ms | 0.14ms | 0.00067ms | 0.007 | 0.007 | n/a | 20.0% | 0.00059ms | 0.00058ms |
| mcpCallEcho | cpu | 0.09ms | 0.16ms | 0.0011ms | 0.012 | 0.011 | n/a | 20.0% | 0.00097ms | 0.00092ms |
| mcpCallCalc | cpu | 0.09ms | 0.12ms | 0.0015ms | 0.017 | 0.016 | n/a | 20.0% | 0.0013ms | 0.0013ms |
| toolRegistryRegister | cpu | 0.09ms | 0.10ms | 0.00029ms | 0.003 | 0.003 | n/a | 20.0% | 0.00025ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mcpListTools | 0.02ms | 20ms | PASS |
| mcpCallEcho | 0.03ms | 20ms | PASS |
| mcpCallCalc | 0.02ms | 20ms | PASS |
| toolRegistryRegister | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| mcpListTools | -9080 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| mcpCallEcho | 22880 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| mcpCallCalc | 4624 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| toolRegistryRegister | 8088 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### mcpListTools

# Perf Report — mcpListTools.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00079ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0024ms |
| stdev | 0.0034ms |
| min | 0.00058ms |
| max | 0.02ms |
| total | 0.47ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.879)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00059ms | 0.00058ms | +0.0000031ms | +0.53% |
| p50 | 0.00070ms | 0.00063ms | +0.000071ms | +11.35% |
| p95 | 0.0097ms | 0.0053ms | +0.0043ms | +81.23% |
| p99 | 0.01ms | 0.01ms | +0.0014ms | +11.82% |
| mean | 0.0021ms | 0.0013ms | +0.00079ms | +62.03% |
| min | 0.00051ms | 0.00054ms | -0.000029ms | -5.31% |
| max | 0.02ms | 0.01ms | +0.0067ms | +50.92% |
| total | 0.41ms | 0.26ms | +0.16ms | +62.03% |

### mcpCallEcho

# Perf Report — mcpCallEcho.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0044ms |
| stdev | 0.02ms |
| min | 0.0010ms |
| max | 0.24ms |
| total | 0.88ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00097ms | 0.00092ms | +0.000049ms | +5.30% |
| p50 | 0.0010ms | 0.00096ms | +0.000079ms | +8.20% |
| p95 | 0.01ms | 0.0029ms | +0.01ms | +397.45% |
| p99 | 0.04ms | 0.0093ms | +0.03ms | +326.81% |
| mean | 0.0038ms | 0.0014ms | +0.0024ms | +176.40% |
| min | 0.00089ms | 0.00088ms | +0.000019ms | +2.21% |
| max | 0.21ms | 0.02ms | +0.18ms | +755.62% |
| total | 0.75ms | 0.27ms | +0.48ms | +176.40% |

### mcpCallCalc

# Perf Report — mcpCallCalc.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0016ms |
| p95 | 0.0044ms |
| p99 | 0.03ms |
| mean | 0.0029ms |
| stdev | 0.0061ms |
| min | 0.0014ms |
| max | 0.07ms |
| total | 0.58ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0013ms | +0.000072ms | +5.75% |
| p50 | 0.0014ms | 0.0013ms | +0.000061ms | +4.57% |
| p95 | 0.0038ms | 0.0031ms | +0.00067ms | +21.50% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +66.50% |
| mean | 0.0025ms | 0.0019ms | +0.00059ms | +30.61% |
| min | 0.0012ms | 0.0012ms | +0.0000075ms | +0.62% |
| max | 0.06ms | 0.03ms | +0.03ms | +81.58% |
| total | 0.50ms | 0.38ms | +0.12ms | +30.61% |

### toolRegistryRegister

# Perf Report — toolRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00055ms |
| p99 | 0.0040ms |
| mean | 0.00042ms |
| stdev | 0.00058ms |
| min | 0.00029ms |
| max | 0.0054ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.863)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | +0.0000011ms | +0.42% |
| p50 | 0.00029ms | 0.00029ms | -0.0000037ms | -1.28% |
| p95 | 0.00047ms | 0.0010ms | -0.00054ms | -53.29% |
| p99 | 0.0035ms | 0.0067ms | -0.0032ms | -48.26% |
| mean | 0.00037ms | 0.00055ms | -0.00018ms | -33.21% |
| min | 0.00025ms | 0.00025ms | +0.0000011ms | +0.42% |
| max | 0.0046ms | 0.01ms | -0.0085ms | -64.67% |
| total | 0.07ms | 0.11ms | -0.04ms | -33.21% |

