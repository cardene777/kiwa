# Perf Suite — crypto-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.16ms | 100ms | PASS | stable (差 0.10ms が下限 0.5ms 未満で判定を保留) |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.05ms | 200ms | PASS | stable (差 0.10ms が下限 0.5ms 未満で判定を保留) |
| kdf_password_batch (5 pbkdf2 derive+verify) | 0.90ms | 1000ms | PASS | improved |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.14ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +851%) 以上の悪化が必要) |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 1.23ms | 500ms | PASS | improved |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | 0.29ms | 200ms | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | 0.19ms | 400ms | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | 3.47ms | 2000ms | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | 0.41ms | 200ms | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | 4.34ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| auth_token_workflow (10 sign+verify+hash) | -29272 B | -147980 B | 102400 B | yes | PASS |
| data_encryption_batch (5 aes-gcm encrypt+decrypt+hash) | -3984 B | -8780 B | 102400 B | yes | PASS |
| kdf_password_batch (5 pbkdf2 derive+verify) | -664 B | 0 B | 102400 B | yes | PASS |
| stream_cipher_batch (5 chacha20 encrypt+decrypt) | -248 B | -12308 B | 102400 B | yes | PASS |
| ed25519_batch (5 sign+verify + 5 RSA sig error) | -3904 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### auth_token_workflow (10 sign+verify+hash)

# Perf Report — auth_token_workflow (10 sign+verify+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.16ms |
| p99 | 0.19ms |
| mean | 0.10ms |
| stdev | 0.03ms |
| min | 0.07ms |
| max | 0.20ms |
| total | 2.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.07ms | +0.02ms | +27.62% |
| p95 | 0.16ms | 0.27ms | -0.10ms | -38.51% |
| p99 | 0.19ms | 0.50ms | -0.31ms | -61.65% |
| mean | 0.10ms | 0.11ms | -0.00ms | -4.01% |
| min | 0.07ms | 0.06ms | +0.01ms | +8.42% |
| max | 0.20ms | 0.71ms | -0.51ms | -72.25% |
| total | 2.06ms | 21.47ms | -19.41ms | -90.40% |

### data_encryption_batch (5 aes-gcm encrypt+decrypt+hash)

# Perf Report — data_encryption_batch (5 aes-gcm encrypt+decrypt+hash).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.03ms | +0.01ms | +16.01% |
| p95 | 0.05ms | 0.15ms | -0.10ms | -66.90% |
| p99 | 0.05ms | 0.24ms | -0.19ms | -78.03% |
| mean | 0.04ms | 0.05ms | -0.01ms | -18.02% |
| min | 0.03ms | 0.03ms | +0.01ms | +27.49% |
| max | 0.06ms | 0.62ms | -0.57ms | -91.17% |
| total | 0.82ms | 9.98ms | -9.16ms | -91.80% |

### kdf_password_batch (5 pbkdf2 derive+verify)

# Perf Report — kdf_password_batch (5 pbkdf2 derive+verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.82ms |
| p95 | 0.90ms |
| p99 | 0.94ms |
| mean | 0.84ms |
| stdev | 0.04ms |
| min | 0.80ms |
| max | 0.95ms |
| total | 16.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.82ms | 0.90ms | -0.07ms | -8.30% |
| p95 | 0.90ms | 1.43ms | -0.53ms | -36.94% |
| p99 | 0.94ms | 1.98ms | -1.03ms | -52.21% |
| mean | 0.84ms | 1.00ms | -0.16ms | -16.36% |
| min | 0.80ms | 0.85ms | -0.05ms | -5.91% |
| max | 0.95ms | 2.27ms | -1.32ms | -58.00% |
| total | 16.73ms | 200.00ms | -183.27ms | -91.64% |

### stream_cipher_batch (5 chacha20 encrypt+decrypt)

# Perf Report — stream_cipher_batch (5 chacha20 encrypt+decrypt).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.14ms |
| p99 | 0.24ms |
| mean | 0.06ms |
| stdev | 0.05ms |
| min | 0.03ms |
| max | 0.26ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.03ms | +0.00ms | +15.53% |
| p95 | 0.14ms | 0.06ms | +0.08ms | +141.88% |
| p99 | 0.24ms | 0.17ms | +0.07ms | +39.30% |
| mean | 0.06ms | 0.05ms | +0.01ms | +14.66% |
| min | 0.03ms | 0.03ms | +0.00ms | +16.18% |
| max | 0.26ms | 2.61ms | -2.36ms | -90.12% |
| total | 1.14ms | 9.92ms | -8.78ms | -88.53% |

### ed25519_batch (5 sign+verify + 5 RSA sig error)

# Perf Report — ed25519_batch (5 sign+verify + 5 RSA sig error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.04ms |
| p95 | 1.23ms |
| p99 | 1.30ms |
| mean | 1.07ms |
| stdev | 0.08ms |
| min | 1.00ms |
| max | 1.31ms |
| total | 21.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.04ms | 1.19ms | -0.15ms | -12.47% |
| p95 | 1.23ms | 2.26ms | -1.03ms | -45.68% |
| p99 | 1.30ms | 2.81ms | -1.51ms | -53.83% |
| mean | 1.07ms | 1.37ms | -0.30ms | -21.91% |
| min | 1.00ms | 1.09ms | -0.09ms | -7.92% |
| max | 1.31ms | 3.30ms | -1.99ms | -60.20% |
| total | 21.38ms | 273.84ms | -252.46ms | -92.19% |

