# Perf Suite — design-check-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00050ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0010ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 0.13ms | 0.46ms | 100ms | 0.00095ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.03ms | 0.04ms | 50ms | 0.00096ms | PASS | stable — gate 無効 (regressionGate=false) |
| regression_scan_burst (50 element layout × 10 iter) | 0.06ms | 0.07ms | 50ms | 0.00093ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | cpu | 0.09ms | 0.12ms | 0.13ms | 1.349 | 1.455 | n/a | 20.0% | 0.12ms | 0.13ms |
| large_spec_conformance (spec 80 keys × 5 iter) | cpu | 0.09ms | 0.09ms | 0.03ms | 0.375 | 0.348 | n/a | 20.0% | 0.03ms | 0.03ms |
| regression_scan_burst (50 element layout × 10 iter) | cpu | 0.09ms | 0.12ms | 0.06ms | 0.606 | 0.580 | n/a | 20.0% | 0.05ms | 0.05ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | 1.71ms | 200ms | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 0.14ms | 100ms | PASS |
| regression_scan_burst (50 element layout × 10 iter) | 0.24ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| full_design_audit (spec + layout combined 10 iter) | -74072 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| large_spec_conformance (spec 80 keys × 5 iter) | 8512 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| regression_scan_burst (50 element layout × 10 iter) | -1608 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### full_design_audit (spec + layout combined 10 iter)

# Perf Report — full_design_audit (spec + layout combined 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.13ms |
| p50 | 0.16ms |
| p95 | 0.46ms |
| p99 | 0.49ms |
| mean | 0.24ms |
| stdev | 0.13ms |
| min | 0.12ms |
| max | 0.50ms |
| total | 7.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.946)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.13ms | -0.0094ms | -7.27% |
| p50 | 0.15ms | 0.16ms | -0.0057ms | -3.56% |
| p95 | 0.43ms | 1.06ms | -0.63ms | -59.11% |
| p99 | 0.46ms | 1.46ms | -1.00ms | -68.56% |
| mean | 0.23ms | 0.32ms | -0.09ms | -29.00% |
| min | 0.12ms | 0.11ms | +0.0038ms | +3.43% |
| max | 0.47ms | 1.47ms | -1.00ms | -67.91% |
| total | 6.79ms | 9.56ms | -2.77ms | -29.00% |

### large_spec_conformance (spec 80 keys × 5 iter)

# Perf Report — large_spec_conformance (spec 80 keys × 5 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0019ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 1.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.963)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0024ms | +7.83% |
| p50 | 0.03ms | 0.03ms | +0.0022ms | +6.66% |
| p95 | 0.04ms | 0.09ms | -0.05ms | -56.45% |
| p99 | 0.04ms | 0.11ms | -0.07ms | -64.00% |
| mean | 0.03ms | 0.05ms | -0.01ms | -25.99% |
| min | 0.03ms | 0.03ms | +0.0019ms | +6.32% |
| max | 0.04ms | 0.12ms | -0.08ms | -65.47% |
| total | 1.04ms | 1.41ms | -0.37ms | -25.99% |

### regression_scan_burst (50 element layout × 10 iter)

# Perf Report — regression_scan_burst (50 element layout × 10 iter).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.09ms |
| mean | 0.06ms |
| stdev | 0.0070ms |
| min | 0.06ms |
| max | 0.09ms |
| total | 1.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.930)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0022ms | +4.42% |
| p50 | 0.05ms | 0.05ms | +0.0017ms | +3.41% |
| p95 | 0.07ms | 0.05ms | +0.01ms | +24.47% |
| p99 | 0.08ms | 0.06ms | +0.02ms | +43.33% |
| mean | 0.05ms | 0.05ms | +0.0032ms | +6.20% |
| min | 0.05ms | 0.05ms | +0.0022ms | +4.38% |
| max | 0.08ms | 0.06ms | +0.03ms | +45.75% |
| total | 1.64ms | 1.55ms | +0.10ms | +6.20% |

