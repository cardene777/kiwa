/**
 * Deterministic sample generators for perf tests. Perf harness inputs
 * (arrival intervals, token counts, message sizes) hardcoded as const
 * arrays give artificially tight variance and let serial p95 gates pass
 * even when real-world usage distribution would fail. These generators
 * emit reproducible samples from Poisson (bursty arrivals) or Zipf
 * (heavy-tail token counts) with a caller-supplied seed so CI runs still
 * compare against a stable baseline.
 *
 * Not intended for security use — the RNG is a mulberry32 seeded state
 * machine, fast and reproducible but not cryptographically strong.
 */

/**
 * mulberry32 seeded PRNG — 32-bit state, returns floats in [0, 1). Same
 * seed always yields the same sequence, so a perf test with `seed=42`
 * observes identical samples on every run and can gate on the resulting
 * distribution shape.
 */
export function makeSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Poisson-distributed sample stream. Knuth's algorithm — simple, correct
 * for the small lambdas (0.5–20) perf tests use for arrival-interval /
 * request-count models. For lambda > ~30 numerical underflow makes this
 * variant unusable, but that regime is out of scope for the dogfood perf
 * suite.
 */
export function samplePoisson(
  count: number,
  lambda: number,
  rng: () => number,
): number[] {
  if (count <= 0) return [];
  if (lambda < 0) throw new Error(`Poisson lambda must be >= 0, got ${lambda}`);
  // Knuth's algorithm underflows once exp(-lambda) drops below
  // Number.MIN_VALUE (~lambda > 745) and gets pathologically slow well
  // before that. Reject upstream so a caller does not silently hang.
  if (lambda > 30) {
    throw new Error(
      `Poisson lambda > 30 unsupported by Knuth variant; use a larger-lambda algorithm or split into chunks (got ${lambda})`,
    );
  }
  const out: number[] = new Array(count);
  const L = Math.exp(-lambda);
  for (let i = 0; i < count; i += 1) {
    let k = 0;
    let p = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      k += 1;
      p *= rng();
      if (p <= L) break;
    }
    out[i] = k - 1;
  }
  return out;
}

/**
 * Zipf-distributed sample stream — heavy-tail integer draws from
 * {1..n}. Rejection method with Devroye's shape parameter is used so
 * larger `s` (skew) values still converge; perf tests use s ≈ 1.07 to
 * approximate the observed prompt-length distribution in production
 * chat traffic.
 */
export function sampleZipf(
  count: number,
  n: number,
  s: number,
  rng: () => number,
): number[] {
  if (count <= 0) return [];
  if (n < 1) throw new Error(`Zipf n must be >= 1, got ${n}`);
  if (s <= 1) throw new Error(`Zipf s must be > 1 (Devroye rejection requires s > 1), got ${s}`);
  const b = Math.pow(2, s - 1);
  const out: number[] = new Array(count);
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const u = 1 - rng();
      const v = rng();
      const x = Math.floor(Math.pow(u, -1 / (s - 1)));
      if (x < 1 || x > n) continue;
      const t = Math.pow(1 + 1 / x, s - 1);
      if ((v * x * (t - 1)) / (b - 1) <= t / b) {
        out[i] = x;
        break;
      }
    }
  }
  return out;
}
