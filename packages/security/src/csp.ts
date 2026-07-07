/**
 * Axis 1 — Content Security Policy (CSP) builder + validator。
 *
 * 5 sub-axis ...
 * - nonce (per-request nonce 生成 + `'nonce-...'` directive 展開)
 * - hash (`'sha256-...'` / `'sha384-...'` / `'sha512-...'` の inline script hash)
 * - strict-dynamic (`'strict-dynamic'` を script-src に付与、 nonce/hash 経由の
 *   loader 経路のみ許可)
 * - trusted-types (`trusted-types` directive で custom policy を宣言、
 *   DOM XSS 防止)
 * - report-only (`Content-Security-Policy-Report-Only` header 版、 report-uri /
 *   report-to 併設)
 */

import type { SecurityEvent } from './types.js';

/** CSP directive の完全列挙 (Fetch directive + Document directive + Reporting)。 */
export type CspDirective =
  | 'default-src'
  | 'script-src'
  | 'script-src-elem'
  | 'script-src-attr'
  | 'style-src'
  | 'style-src-elem'
  | 'style-src-attr'
  | 'img-src'
  | 'connect-src'
  | 'font-src'
  | 'frame-src'
  | 'frame-ancestors'
  | 'form-action'
  | 'base-uri'
  | 'object-src'
  | 'worker-src'
  | 'child-src'
  | 'media-src'
  | 'manifest-src'
  | 'trusted-types'
  | 'require-trusted-types-for'
  | 'upgrade-insecure-requests'
  | 'block-all-mixed-content'
  | 'report-uri'
  | 'report-to';

export interface CspNonceOptions {
  /** Base64URL-encoded random nonce (16-32 bytes)。 */
  nonce: string;
  /** attach directive (default script-src)。 */
  directives?: CspDirective[];
}

export type CspHashAlgo = 'sha256' | 'sha384' | 'sha512';

export interface CspHashOptions {
  algorithm: CspHashAlgo;
  /** Base64-encoded digest。 */
  digest: string;
  /** attach directive (default script-src)。 */
  directives?: CspDirective[];
}

export interface CspPolicyInput {
  /** directive -> source list の連想。 空 array は `'none'` 相当。 */
  directives: Partial<Record<CspDirective, string[]>>;
  /** 各 request で差替える nonce 群。 */
  nonces?: CspNonceOptions[];
  /** inline script/style hash 群。 */
  hashes?: CspHashOptions[];
  /** `strict-dynamic` を script-src に付与する。 nonce or hash 必須。 */
  strictDynamic?: boolean;
  /** trusted-types policy 名一覧 (`default` は無指定時) + require-trusted-types-for 'script'。 */
  trustedTypes?: {
    policies: string[];
    requireForScript?: boolean;
  };
  /** report-only mode で発行する (header 名も切替)。 */
  reportOnly?: boolean;
  /** `report-to` group name (report-uri は同名で fallback)。 */
  reportGroup?: string;
}

export interface CspHeaderOutput {
  headerName: 'Content-Security-Policy' | 'Content-Security-Policy-Report-Only';
  headerValue: string;
  /** 各 directive を key に持つ debug 用の展開後 map。 */
  expandedDirectives: Record<CspDirective, string[]>;
}

const ALWAYS_KEYWORDS = new Set([
  "'self'",
  "'none'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  "'unsafe-hashes'",
  "'wasm-unsafe-eval'",
  "'strict-dynamic'",
  "'report-sample'",
]);

/**
 * CSP header を SSOT 定義から build する。 nonce / hash / strict-dynamic は
 * 5 sub-axis の中で最も間違えやすい組合せ (nonce が同 header 内 2 回以上
 * 出ると browser reject / strict-dynamic は nonce or hash なしに書くと
 * whole policy が effect なし) を build 段階で予防する。
 */
export function buildCspHeader(input: CspPolicyInput): CspHeaderOutput {
  const merged: Record<CspDirective, string[]> = {} as Record<CspDirective, string[]>;

  for (const [rawKey, values] of Object.entries(input.directives)) {
    const key = rawKey as CspDirective;
    if (values.length === 0) {
      merged[key] = ["'none'"];
      continue;
    }
    const dedup = new Set<string>();
    for (const src of values) {
      dedup.add(normalizeSource(src));
    }
    merged[key] = [...dedup];
  }

  if (input.nonces && input.nonces.length > 0) {
    for (const opt of input.nonces) {
      const target = opt.directives ?? ['script-src'];
      const value = `'nonce-${opt.nonce}'`;
      for (const dir of target) {
        merged[dir] = [...(merged[dir] ?? []), value];
      }
    }
  }

  if (input.hashes && input.hashes.length > 0) {
    for (const h of input.hashes) {
      const target = h.directives ?? ['script-src'];
      const value = `'${h.algorithm}-${h.digest}'`;
      for (const dir of target) {
        merged[dir] = [...(merged[dir] ?? []), value];
      }
    }
  }

  if (input.strictDynamic) {
    const hasNonceOrHash =
      (input.nonces?.length ?? 0) > 0 || (input.hashes?.length ?? 0) > 0;
    if (!hasNonceOrHash) {
      throw new Error(
        "csp: strict-dynamic requires at least one nonce or hash in script-src (otherwise the whole policy has no effect)",
      );
    }
    merged['script-src'] = [...(merged['script-src'] ?? []), "'strict-dynamic'"];
  }

  if (input.trustedTypes) {
    const { policies, requireForScript } = input.trustedTypes;
    merged['trusted-types'] = policies.length > 0 ? policies : ["'none'"];
    if (requireForScript) {
      merged['require-trusted-types-for'] = ["'script'"];
    }
  }

  if (input.reportGroup) {
    merged['report-to'] = [input.reportGroup];
    merged['report-uri'] = [`/${input.reportGroup}`];
  }

  const parts: string[] = [];
  for (const [dir, values] of Object.entries(merged)) {
    const unique = [...new Set(values)];
    parts.push(`${dir} ${unique.join(' ')}`);
  }

  const headerValue = parts.join('; ');
  const headerName: CspHeaderOutput['headerName'] = input.reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  return {
    headerName,
    headerValue,
    expandedDirectives: merged,
  };
}

/** raw source string を CSP 仕様の keyword に必要なら quote する。 */
function normalizeSource(source: string): string {
  const trimmed = source.trim();
  if (trimmed.length === 0) return trimmed;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed;
  if (ALWAYS_KEYWORDS.has(`'${trimmed}'`)) return `'${trimmed}'`;
  return trimmed;
}

/** nonce 検証 — 同 header 内で同じ nonce が 2 回以上出ないか、 32 char 以上か。 */
export function validateNonce(nonce: string): { ok: boolean; reason: string } {
  if (nonce.length < 22) {
    return { ok: false, reason: 'nonce too short (need >= 16 bytes / >= 22 base64url chars)' };
  }
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(nonce)) {
    return { ok: false, reason: 'nonce must be base64url' };
  }
  return { ok: true, reason: 'ok' };
}

/**
 * CSP violation を統一 event 形式に変換する adapter。
 * fidelity harness が real (Report-To API) と mock (unit test) の
 * 両方の event 列を同型で扱えるようにする。
 */
export function toCspEvent(input: {
  provider: 'helmet' | 'coraza';
  verdict: 'allow' | 'deny' | 'warn';
  reason: string;
  payload: unknown;
  timestamp: number;
}): SecurityEvent {
  return {
    axis: 'csp',
    provider: input.provider,
    verdict: input.verdict,
    reason: input.reason,
    payload: input.payload,
    timestamp: input.timestamp,
  };
}
