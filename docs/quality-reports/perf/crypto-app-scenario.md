# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.08ms | 0.35ms | 100ms | 0.00051ms | PASS | stable (換算後 p10 -6% (閾値未満)、 p95 +82% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.04ms | 0.11ms | 200ms | 0.00050ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +95% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.92ms | 1.92ms | 1000ms | 0.00051ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.04ms | 0.18ms | 100ms | 0.00051ms | PASS | stable (換算後 p10 +10% (閾値未満)、 p95 +68% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.15ms | 1.22ms | 500ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | cpu | 0.09ms | 0.11ms | 0.08ms | 0.877 | 0.928 | n/a | 20.0% | 0.07ms | 0.08ms |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | cpu | 0.09ms | 0.12ms | 0.04ms | 0.456 | 0.449 | n/a | 20.0% | 0.04ms | 0.04ms |
| kdf_password_batch (5 pbkdf2 derive+verify) | cpu | 0.09ms | 0.12ms | 0.92ms | 9.834 | 9.793 | n/a | 20.0% | 0.82ms | 0.81ms |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | cpu | 0.09ms | 0.13ms | 0.04ms | 0.414 | 0.377 | n/a | 20.0% | 0.03ms | 0.03ms |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | cpu | 0.09ms | 0.09ms | 1.15ms | 12.232 | 12.596 | n/a | 20.0% | 0.99ms | 1.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.36ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.69ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 4.97ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.38ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 10.92ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -24392 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 216 B | -15872 B | 102400 B | yes | 23 (3 + 20) | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | -232 B | -2720 B | 102400 B | yes | 23 (3 + 20) | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 648 B | -10768 B | 102400 B | yes | 23 (3 + 20) | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -9024 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.12ms |
| p95 | 0.35ms |
| p99 | 0.35ms |
| mean | 0.16ms |
| stdev | 0.10ms |
| min | 0.08ms |
| max | 0.35ms |
| total | 3.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.885)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.08ms | -0.0042ms | -5.55% |
| p50 | 0.10ms | 0.10ms | +0.0059ms | +6.08% |
| p95 | 0.31ms | 0.17ms | +0.14ms | +81.69% |
| p99 | 0.31ms | 0.25ms | +0.06ms | +22.22% |
| mean | 0.14ms | 0.11ms | +0.03ms | +32.84% |
| min | 0.07ms | 0.07ms | -0.00031ms | -0.45% |
| max | 0.31ms | 0.28ms | +0.04ms | +13.14% |
| total | 2.80ms | 2.11ms | +0.69ms | +32.84% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.11ms |
| p99 | 0.26ms |
| mean | 0.07ms |
| stdev | 0.06ms |
| min | 0.04ms |
| max | 0.29ms |
| total | 1.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.865)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00062ms | +1.71% |
| p50 | 0.04ms | 0.04ms | +0.0048ms | +12.25% |
| p95 | 0.09ms | 0.05ms | +0.05ms | +95.01% |
| p99 | 0.22ms | 0.05ms | +0.17ms | +338.01% |
| mean | 0.06ms | 0.04ms | +0.02ms | +39.77% |
| min | 0.04ms | 0.04ms | +0.00027ms | +0.75% |
| max | 0.25ms | 0.05ms | +0.20ms | +395.23% |
| total | 1.13ms | 0.81ms | +0.32ms | +39.77% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.92ms |
| p50 | 0.93ms |
| p95 | 1.92ms |
| p99 | 1.99ms |
| mean | 1.11ms |
| stdev | 0.35ms |
| min | 0.92ms |
| max | 2.01ms |
| total | 22.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.82ms | 0.81ms | +0.0034ms | +0.42% |
| p50 | 0.83ms | 0.89ms | -0.06ms | -7.29% |
| p95 | 1.70ms | 1.26ms | +0.44ms | +34.54% |
| p99 | 1.76ms | 1.36ms | +0.40ms | +29.69% |
| mean | 0.98ms | 0.96ms | +0.02ms | +2.13% |
| min | 0.82ms | 0.80ms | +0.02ms | +1.97% |
| max | 1.78ms | 1.38ms | +0.39ms | +28.58% |
| total | 19.55ms | 19.14ms | +0.41ms | +2.13% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.18ms |
| p99 | 0.19ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.19ms |
| total | 1.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.880)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0030ms | +9.73% |
| p50 | 0.04ms | 0.04ms | +0.0094ms | +26.83% |
| p95 | 0.15ms | 0.09ms | +0.06ms | +68.34% |
| p99 | 0.17ms | 0.11ms | +0.06ms | +52.68% |
| mean | 0.07ms | 0.04ms | +0.03ms | +59.29% |
| min | 0.03ms | 0.03ms | +0.0023ms | +7.43% |
| max | 0.17ms | 0.11ms | +0.06ms | +49.54% |
| total | 1.35ms | 0.84ms | +0.50ms | +59.29% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.15ms |
| p50 | 1.16ms |
| p95 | 1.22ms |
| p99 | 1.47ms |
| mean | 1.18ms |
| stdev | 0.08ms |
| min | 1.15ms |
| max | 1.53ms |
| total | 23.68ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.99ms | 1.02ms | -0.03ms | -2.89% |
| p50 | 1.00ms | 1.06ms | -0.06ms | -5.60% |
| p95 | 1.05ms | 1.20ms | -0.15ms | -12.26% |
| p99 | 1.27ms | 1.22ms | +0.05ms | +4.22% |
| mean | 1.02ms | 1.09ms | -0.07ms | -6.23% |
| min | 0.99ms | 1.00ms | -0.0078ms | -0.78% |
| max | 1.32ms | 1.22ms | +0.10ms | +8.26% |
| total | 20.46ms | 21.82ms | -1.36ms | -6.23% |

