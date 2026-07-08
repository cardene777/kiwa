/**
 * Shared types for `@kiwa/security` — 4 provider unified mock over 8 axis
 * of security posture (Content Security Policy / rate limiting / authorization
 * / WAF / threat modeling / secrets scanning / SBOM / advanced security headers).
 *
 * v1.37 milestone (Issue #1087, GH mirror of CAR-824) で新設。 kiwa 思想 =
 * 「1 度書けば 4 security provider 同一挙動で回せる mock」 を実現するため、
 * provider 非依存な 8 axis を SSOT として定義する。
 *
 * 4 provider = helmet-style CSP builder / express-rate-limit compatible limiter /
 * casbin-style policy engine / coraza-style WAF engine。 provider ごとの
 * adapter は本 file の共通型を provider 固有 shape に変換する薄い層に留める。
 */

/**
 * 8 axis の識別子。 SSOT なので追加変更は quality-metrics `SECURITY_AXES`
 * と同期する必要がある。
 */
export type SecurityAxis =
  | 'csp'
  | 'rate-limit'
  | 'authorization'
  | 'waf'
  | 'threat-model'
  | 'secrets-scan'
  | 'sbom'
  | 'security-headers';

/**
 * 4 provider の識別子。 v0.1 でカバーする provider adapter は 4 種類固定
 * (fidelity harness の 32 grid 前提)。
 */
export type SecurityProvider = 'helmet' | 'express-rate-limit' | 'casbin' | 'coraza';

/** 8 axis 全部の判定 verdict の共通契約。 */
export type SecurityVerdict = 'allow' | 'deny' | 'warn';

/**
 * 統一 mock 経路の共通 event — 4 provider adapter が emit する
 * 全 event 列を fidelity harness で照合する。
 */
export interface SecurityEvent<TPayload = unknown> {
  axis: SecurityAxis;
  provider: SecurityProvider;
  verdict: SecurityVerdict;
  reason: string;
  payload: TPayload;
  /** event 発火の相対 timestamp (ms、 collector 起点)。 */
  timestamp: number;
}

/**
 * driver 共通契約 — real / mock 両方に同じ shape で実装される。
 * fidelity harness が同一 scenario を real と mock に投げて event 列を照合する。
 */
export interface SecurityDriver {
  readonly provider: SecurityProvider;
  readonly axis: SecurityAxis;
  runScenario(scenarioId: string): Promise<SecurityEvent[]>;
  reset(): void;
}
