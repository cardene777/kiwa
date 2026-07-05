/**
 * Real driver env-gate — v0.2 (GH #971) で追加。
 *
 * v1.13 の 4 provider (Supabase / Ably / Pusher / Socket.io) mock は default
 * で完全に mock 化されており、 test 実行時に外部 network を叩かない。 一方、
 * dogfood app や real-vs-mock fidelity 計測では、 real provider に対して同じ
 * scenario を回して差分を取りたい局面がある。
 *
 * 本 helper は「real driver を返すべきか」 を env variable で決定する gate。
 * `KIWA_MODE=real` かつ provider 別の必須 key set (env variable) が全て
 * 揃った時にのみ real driver を作成する。 それ以外の場合は mock driver を
 * 返す (fallback、 常に安全)。
 *
 * 呼出例 (real Supabase client を得たい場合) ...
 *
 * ```ts
 * const driver = resolveRealtimeDriver({
 *   provider: 'supabase',
 *   requiredKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
 *   createReal: (env) => createRealSupabaseDriver(env),
 *   createMock: () => createMockSupabaseDriver(),
 * });
 * ```
 *
 * real driver 実装は kiwa の SSOT には含まれない (外部 SDK 依存を避けるため)、
 * user (dogfood app 側) が real driver factory を渡す責務を持つ。
 */

export type RealtimeProviderName = 'supabase' | 'ably' | 'pusher' | 'socketio';

export interface RealDriverGateInput<TDriver> {
  provider: RealtimeProviderName;
  /** real driver に必要な env variable key 一覧 (全 set で real 起動)。 */
  requiredKeys: string[];
  /** real driver factory — 全 env が揃った時のみ呼ばれる。 */
  createReal: (env: Record<string, string>) => TDriver;
  /** mock driver factory — env 不揃い時の fallback。 */
  createMock: () => TDriver;
  /** env source (default `process.env`)。 test で override 可能。 */
  envSource?: Record<string, string | undefined>;
}

export interface RealDriverGateResult<TDriver> {
  driver: TDriver;
  /** 実際に real 経路を選んだか。 mock fallback 時 false。 */
  isReal: boolean;
  /** real 選択の判定理由 — log 出力 / provenance に使う。 */
  reason: string;
  /** 不足した env key (isReal=false の時のみ non-empty)。 */
  missingKeys: string[];
}

/** provider 別 default 必須 env key (SSOT)。 */
export const REAL_DRIVER_REQUIRED_KEYS: Record<RealtimeProviderName, string[]> = {
  supabase: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  ably: ['ABLY_API_KEY'],
  pusher: ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER'],
  socketio: ['SOCKETIO_URL'],
};

export function resolveRealtimeDriver<TDriver>(
  input: RealDriverGateInput<TDriver>,
): RealDriverGateResult<TDriver> {
  const envSource = input.envSource ?? (process?.env ?? {});
  const mode = envSource.KIWA_MODE ?? 'mock';
  if (mode !== 'real') {
    return {
      driver: input.createMock(),
      isReal: false,
      reason: `KIWA_MODE=${mode} (not "real"), mock fallback`,
      missingKeys: [],
    };
  }
  const missing: string[] = [];
  const collected: Record<string, string> = {};
  for (const key of input.requiredKeys) {
    const value = envSource[key];
    if (value === undefined || value === '') {
      missing.push(key);
    } else {
      collected[key] = value;
    }
  }
  if (missing.length > 0) {
    return {
      driver: input.createMock(),
      isReal: false,
      reason: `KIWA_MODE=real but missing ${missing.join(',')}`,
      missingKeys: missing,
    };
  }
  return {
    driver: input.createReal(collected),
    isReal: true,
    reason: `KIWA_MODE=real + all required keys present`,
    missingKeys: [],
  };
}

/**
 * shorthand — provider 名から必須 key を lookup して gate 判定する。
 * 使い分けは自由だが、 4 provider の default key set (SSOT
 * `REAL_DRIVER_REQUIRED_KEYS`) を尊重する場合はこちらを使う。
 */
export function resolveRealtimeDriverByProvider<TDriver>(
  provider: RealtimeProviderName,
  createReal: (env: Record<string, string>) => TDriver,
  createMock: () => TDriver,
  envSource?: Record<string, string | undefined>,
): RealDriverGateResult<TDriver> {
  return resolveRealtimeDriver({
    provider,
    requiredKeys: REAL_DRIVER_REQUIRED_KEYS[provider],
    createReal,
    createMock,
    ...(envSource !== undefined ? { envSource } : {}),
  });
}
