# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.07ms | 0.20ms | 100ms | 0.00043ms | PASS | stable (p10 +7% (閾値未満)、 p95 +65% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.04ms | 0.06ms | 200ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.82ms | 0.93ms | 1000ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.03ms | 0.08ms | 100ms | 0.00042ms | PASS | stable (p10 +5% (閾値未満)、 p95 +57% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.00ms | 1.16ms | 500ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | cpu | 0.08ms | 0.07ms | 0.895 | 0.840 | 0.07ms | 0.07ms |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | cpu | 0.08ms | 0.04ms | 0.490 | 0.461 | 0.04ms | 0.04ms |
| kdf_password_batch (5 pbkdf2 derive+verify) | cpu | 0.08ms | 0.82ms | 9.940 | 10.003 | 0.81ms | 0.81ms |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | cpu | 0.08ms | 0.03ms | 0.402 | 0.384 | 0.03ms | 0.03ms |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | cpu | 0.08ms | 1.00ms | 12.413 | 12.603 | 1.01ms | 1.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.31ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.21ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.32ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.14ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 4.36ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -800 B | -132708 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -5232 B | -8192 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 696 B | 0 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | -360 B | -12908 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -9024 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.09ms |
| p95 | 0.20ms |
| p99 | 0.20ms |
| mean | 0.11ms |
| stdev | 0.04ms |
| min | 0.07ms |
| max | 0.20ms |
| total | 2.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.07ms | +0.0027ms | +3.93% |
| p50 | 0.09ms | 0.09ms | +0.0028ms | +3.16% |
| p95 | 0.20ms | 0.12ms | +0.08ms | +60.77% |
| p99 | 0.20ms | 0.21ms | -0.0031ms | -1.49% |
| mean | 0.11ms | 0.09ms | +0.01ms | +12.04% |
| min | 0.07ms | 0.07ms | +0.0036ms | +5.35% |
| max | 0.20ms | 0.23ms | -0.02ms | -10.07% |
| total | 2.13ms | 1.90ms | +0.23ms | +12.04% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.14ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.16ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0037ms | +10.00% |
| p50 | 0.04ms | 0.04ms | +0.0026ms | +6.27% |
| p95 | 0.06ms | 0.07ms | -0.01ms | -15.78% |
| p99 | 0.14ms | 0.08ms | +0.07ms | +85.26% |
| mean | 0.05ms | 0.05ms | +0.0046ms | +9.90% |
| min | 0.04ms | 0.04ms | +0.0047ms | +13.39% |
| max | 0.16ms | 0.08ms | +0.08ms | +108.25% |
| total | 1.02ms | 0.93ms | +0.09ms | +9.90% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.82ms |
| p50 | 0.84ms |
| p95 | 0.93ms |
| p99 | 0.94ms |
| mean | 0.85ms |
| stdev | 0.03ms |
| min | 0.81ms |
| max | 0.95ms |
| total | 16.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.82ms | 0.81ms | +0.0064ms | +0.79% |
| p50 | 0.84ms | 0.83ms | +0.01ms | +1.79% |
| p95 | 0.93ms | 0.90ms | +0.02ms | +2.34% |
| p99 | 0.94ms | 0.93ms | +0.02ms | +1.63% |
| mean | 0.85ms | 0.84ms | +0.0059ms | +0.70% |
| min | 0.81ms | 0.81ms | -0.0015ms | -0.18% |
| max | 0.95ms | 0.93ms | +0.01ms | +1.46% |
| total | 16.93ms | 16.81ms | +0.12ms | +0.70% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0015ms | +4.87% |
| p50 | 0.03ms | 0.03ms | +0.0013ms | +4.04% |
| p95 | 0.08ms | 0.05ms | +0.03ms | +56.60% |
| p99 | 0.09ms | 0.12ms | -0.03ms | -24.92% |
| mean | 0.04ms | 0.04ms | +0.00016ms | +0.40% |
| min | 0.03ms | 0.03ms | +0.0018ms | +6.06% |
| max | 0.09ms | 0.13ms | -0.04ms | -32.50% |
| total | 0.79ms | 0.79ms | +0.0031ms | +0.40% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.00ms |
| p50 | 1.05ms |
| p95 | 1.16ms |
| p99 | 1.23ms |
| mean | 1.06ms |
| stdev | 0.06ms |
| min | 0.99ms |
| max | 1.24ms |
| total | 21.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.00ms | 1.03ms | -0.03ms | -3.21% |
| p50 | 1.05ms | 1.04ms | +0.0040ms | +0.38% |
| p95 | 1.16ms | 1.14ms | +0.02ms | +2.08% |
| p99 | 1.23ms | 1.15ms | +0.08ms | +6.64% |
| mean | 1.06ms | 1.06ms | -0.0029ms | -0.27% |
| min | 0.99ms | 1.02ms | -0.02ms | -2.32% |
| max | 1.24ms | 1.15ms | +0.09ms | +7.76% |
| total | 21.14ms | 21.20ms | -0.06ms | -0.27% |

