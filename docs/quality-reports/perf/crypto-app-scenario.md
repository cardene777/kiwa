# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.09ms | 0.19ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.04ms | 0.07ms | 200ms | 0.00050ms | PASS | stable (p10 +1% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.89ms | 1.40ms | 1000ms | 0.00050ms | PASS | stable (p10 +9% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.04ms | 0.05ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.07ms | 1.79ms | 500ms | 0.00050ms | PASS | stable (p10 +3% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.57ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.20ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 4.00ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.29ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 5.28ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -19664 B | -1728 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 14664 B | -12844 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 712 B | -12512 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 616 B | -25292 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -10000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.19ms |
| p99 | 0.35ms |
| mean | 0.13ms |
| stdev | 0.07ms |
| min | 0.08ms |
| max | 0.39ms |
| total | 2.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.08ms | +0.02ms | +21.44% |
| p50 | 0.11ms | 0.11ms | +0.0063ms | +5.91% |
| p95 | 0.19ms | 0.25ms | -0.06ms | -22.97% |
| p99 | 0.35ms | 0.33ms | +0.02ms | +4.62% |
| mean | 0.13ms | 0.13ms | +0.00089ms | +0.69% |
| min | 0.08ms | 0.07ms | +0.01ms | +16.16% |
| max | 0.39ms | 0.35ms | +0.03ms | +9.39% |
| total | 2.60ms | 2.58ms | +0.02ms | +0.69% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.10ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.11ms |
| total | 0.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00030ms | +0.81% |
| p50 | 0.04ms | 0.04ms | -0.0013ms | -2.98% |
| p95 | 0.07ms | 0.06ms | +0.01ms | +22.44% |
| p99 | 0.10ms | 0.06ms | +0.04ms | +65.50% |
| mean | 0.05ms | 0.04ms | +0.0033ms | +7.36% |
| min | 0.04ms | 0.04ms | +0.00042ms | +1.15% |
| max | 0.11ms | 0.06ms | +0.05ms | +76.17% |
| total | 0.97ms | 0.90ms | +0.07ms | +7.36% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.89ms |
| p50 | 0.94ms |
| p95 | 1.40ms |
| p99 | 1.61ms |
| mean | 0.99ms |
| stdev | 0.19ms |
| min | 0.85ms |
| max | 1.66ms |
| total | 19.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.89ms | 0.82ms | +0.07ms | +8.83% |
| p50 | 0.94ms | 0.83ms | +0.11ms | +12.86% |
| p95 | 1.40ms | 1.02ms | +0.38ms | +37.25% |
| p99 | 1.61ms | 1.09ms | +0.53ms | +48.50% |
| mean | 0.99ms | 0.86ms | +0.13ms | +14.93% |
| min | 0.85ms | 0.81ms | +0.04ms | +4.56% |
| max | 1.66ms | 1.10ms | +0.56ms | +51.11% |
| total | 19.88ms | 17.30ms | +2.58ms | +14.93% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.19ms |
| mean | 0.05ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.23ms |
| total | 0.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0033ms | +10.18% |
| p50 | 0.04ms | 0.04ms | +0.0020ms | +5.62% |
| p95 | 0.05ms | 0.09ms | -0.03ms | -36.98% |
| p99 | 0.19ms | 0.18ms | +0.01ms | +7.52% |
| mean | 0.05ms | 0.05ms | -0.000023ms | -0.05% |
| min | 0.03ms | 0.03ms | +0.0049ms | +16.25% |
| max | 0.23ms | 0.21ms | +0.02ms | +12.15% |
| total | 0.96ms | 0.96ms | -0.00046ms | -0.05% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.07ms |
| p50 | 1.16ms |
| p95 | 1.79ms |
| p99 | 2.81ms |
| mean | 1.30ms |
| stdev | 0.45ms |
| min | 1.05ms |
| max | 3.06ms |
| total | 25.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.07ms | 1.04ms | +0.03ms | +3.09% |
| p50 | 1.16ms | 1.18ms | -0.02ms | -1.88% |
| p95 | 1.79ms | 1.45ms | +0.34ms | +23.43% |
| p99 | 2.81ms | 1.67ms | +1.13ms | +67.84% |
| mean | 1.30ms | 1.21ms | +0.09ms | +7.21% |
| min | 1.05ms | 1.04ms | +0.0081ms | +0.78% |
| max | 3.06ms | 1.73ms | +1.33ms | +77.15% |
| total | 25.90ms | 24.16ms | +1.74ms | +7.21% |

