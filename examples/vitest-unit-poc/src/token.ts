/**
 * 発行 token の正規化と失効判定。
 *
 * `unit` layer の対象は「外部依存を持たない純粋な logic」 で、 backing package を要らない
 * (`docs/layers.json` の `unit` は `backing_package: null`)。 この module も import を持たず、
 * 時刻だけを外から受ける。
 */

export interface TokenOptions {
  /** 正規化後の最大長。 超えた分は切り詰める。 */
  maxLength?: number;
}

/**
 * token の表示名を URL に置ける形へ正規化する。
 *
 * 小文字化し、 英数字以外を `-` に潰し、 連続する `-` を 1 つにまとめ、 両端の `-` を落とす。
 * `maxLength` を渡した時は切り詰めた後にもう一度両端の `-` を落とす = 切り口が `-` で終わると
 * 末尾に区切りだけが残るため。
 */
export function normalizeTag(input: string, options: TokenOptions = {}): string {
  const collapsed = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const max = options.maxLength;
  if (max === undefined) return collapsed;
  if (max <= 0) return '';
  return collapsed.slice(0, max).replace(/-$/, '');
}

/**
 * 発行時刻と TTL から失効しているかを返す。
 *
 * 境界 (`issuedAt + ttlMs` ちょうど) は **失効とみなす**。 「有効な間」 を半開区間
 * `[issuedAt, issuedAt + ttlMs)` に取るため、 TTL 0 の token は発行直後から失効している。
 *
 * `now` を引数で受けず `Date.now()` を読むのは、 呼出側に時刻を配って回らないため。
 * test は `vi.useFakeTimers` で固定する。
 */
export function isExpired(issuedAt: number, ttlMs: number): boolean {
  if (!Number.isFinite(issuedAt) || !Number.isFinite(ttlMs)) return true;
  if (ttlMs < 0) return true;
  return Date.now() - issuedAt >= ttlMs;
}

/**
 * 再試行の待ち時間 (ミリ秒)。
 *
 * `base * 2^attempt` を `cap` で頭打ちにする。 `attempt` は 0 起点で、 負値は 0 として扱う。
 * 乱数を混ぜないのは、 混ぜると test が実行ごとに違う値を見ることになるため
 * (揺らぎが要る場合は呼出側で足す)。
 */
export function nextBackoffMs(attempt: number, base = 100, cap = 10_000): number {
  const safeAttempt = Math.max(0, Math.trunc(attempt));
  const raw = base * 2 ** safeAttempt;
  return Math.min(raw, cap);
}
