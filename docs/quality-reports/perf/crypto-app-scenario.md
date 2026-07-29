# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.07ms | 0.11ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.04ms | 0.05ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.82ms | 0.97ms | 1000ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.03ms | 0.08ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.02ms | 1.18ms | 500ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.28ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.20ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.49ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.22ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 4.36ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -18992 B | 0 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -3808 B | -8192 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 664 B | 0 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 712 B | -13744 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -9056 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.09ms |
| p95 | 0.11ms |
| p99 | 0.13ms |
| mean | 0.09ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.13ms |
| total | 1.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.08ms | -0.01ms | -14.11% |
| p50 | 0.09ms | 0.11ms | -0.01ms | -11.50% |
| p95 | 0.11ms | 0.25ms | -0.13ms | -53.33% |
| p99 | 0.13ms | 0.33ms | -0.21ms | -62.10% |
| mean | 0.09ms | 0.13ms | -0.04ms | -30.21% |
| min | 0.06ms | 0.07ms | -0.0087ms | -12.43% |
| max | 0.13ms | 0.35ms | -0.23ms | -63.61% |
| total | 1.80ms | 2.58ms | -0.78ms | -30.21% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0047ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00021ms | -0.58% |
| p50 | 0.04ms | 0.04ms | -0.0020ms | -4.62% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -18.38% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -17.83% |
| mean | 0.04ms | 0.04ms | -0.0034ms | -7.45% |
| min | 0.04ms | 0.04ms | -0.00033ms | -0.92% |
| max | 0.05ms | 0.06ms | -0.01ms | -17.69% |
| total | 0.83ms | 0.90ms | -0.07ms | -7.45% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.82ms |
| p50 | 0.87ms |
| p95 | 0.97ms |
| p99 | 0.98ms |
| mean | 0.87ms |
| stdev | 0.05ms |
| min | 0.80ms |
| max | 0.98ms |
| total | 17.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.82ms | 0.82ms | -0.0050ms | -0.61% |
| p50 | 0.87ms | 0.83ms | +0.04ms | +5.30% |
| p95 | 0.97ms | 1.02ms | -0.05ms | -4.80% |
| p99 | 0.98ms | 1.09ms | -0.11ms | -9.95% |
| mean | 0.87ms | 0.86ms | +0.0086ms | +0.99% |
| min | 0.80ms | 0.81ms | -0.01ms | -1.44% |
| max | 0.98ms | 1.10ms | -0.12ms | -11.14% |
| total | 17.47ms | 17.30ms | +0.17ms | +0.99% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 0.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00057ms | -1.78% |
| p50 | 0.04ms | 0.04ms | +0.00044ms | +1.23% |
| p95 | 0.08ms | 0.09ms | -0.00062ms | -0.73% |
| p99 | 0.09ms | 0.18ms | -0.09ms | -47.86% |
| mean | 0.05ms | 0.05ms | -0.0012ms | -2.53% |
| min | 0.03ms | 0.03ms | +0.00071ms | +2.36% |
| max | 0.10ms | 0.21ms | -0.11ms | -52.76% |
| total | 0.93ms | 0.96ms | -0.02ms | -2.53% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.02ms |
| p50 | 1.04ms |
| p95 | 1.18ms |
| p99 | 1.18ms |
| mean | 1.07ms |
| stdev | 0.06ms |
| min | 1.01ms |
| max | 1.19ms |
| total | 21.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.02ms | 1.04ms | -0.02ms | -2.40% |
| p50 | 1.04ms | 1.18ms | -0.14ms | -11.85% |
| p95 | 1.18ms | 1.45ms | -0.27ms | -18.74% |
| p99 | 1.18ms | 1.67ms | -0.49ms | -29.15% |
| mean | 1.07ms | 1.21ms | -0.14ms | -11.19% |
| min | 1.01ms | 1.04ms | -0.03ms | -2.96% |
| max | 1.19ms | 1.73ms | -0.54ms | -31.34% |
| total | 21.45ms | 24.16ms | -2.70ms | -11.19% |

