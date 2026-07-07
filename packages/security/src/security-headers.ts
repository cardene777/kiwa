/**
 * Axis 8 — Security headers advanced builder + validator。
 *
 * 5 sub-axis ...
 * - HSTS (`Strict-Transport-Security` max-age + includeSubDomains + preload)
 * - X-Frame-Options (`DENY` / `SAMEORIGIN` / `ALLOW-FROM`)
 * - X-Content-Type-Options (`nosniff` 固定)
 * - Referrer-Policy (8 種の enum + fallback strategy)
 * - Permissions-Policy (feature 単位 allowlist、 formerly Feature-Policy)
 */

import type { SecurityEvent } from './types.js';

export interface HstsOptions {
  maxAgeSec: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

export type XFrameOption =
  | { mode: 'DENY' }
  | { mode: 'SAMEORIGIN' }
  | { mode: 'ALLOW-FROM'; uri: string };

export type ReferrerPolicyValue =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

/** Permissions-Policy feature 名 — Chrome/Firefox で実装されている代表 feature。 */
export type PermissionsFeature =
  | 'accelerometer'
  | 'ambient-light-sensor'
  | 'autoplay'
  | 'battery'
  | 'camera'
  | 'display-capture'
  | 'document-domain'
  | 'encrypted-media'
  | 'execution-while-not-rendered'
  | 'execution-while-out-of-viewport'
  | 'fullscreen'
  | 'geolocation'
  | 'gyroscope'
  | 'magnetometer'
  | 'microphone'
  | 'midi'
  | 'payment'
  | 'picture-in-picture'
  | 'publickey-credentials-get'
  | 'screen-wake-lock'
  | 'sync-xhr'
  | 'usb'
  | 'web-share'
  | 'xr-spatial-tracking';

/** allowlist source per feature — `*`, `self`, or explicit origin list. */
export type PermissionsSource = '*' | 'self' | 'none' | { origins: string[] };

export interface SecurityHeadersInput {
  hsts?: HstsOptions;
  xFrame?: XFrameOption;
  /** nosniff は固定なので on/off だけ。 */
  xContentTypeOptions?: boolean;
  referrerPolicy?: ReferrerPolicyValue;
  permissionsPolicy?: Partial<Record<PermissionsFeature, PermissionsSource>>;
}

export interface SecurityHeadersOutput {
  headers: Record<string, string>;
}

export function buildSecurityHeaders(input: SecurityHeadersInput): SecurityHeadersOutput {
  const headers: Record<string, string> = {};

  if (input.hsts) {
    headers['Strict-Transport-Security'] = buildHsts(input.hsts);
  }

  if (input.xFrame) {
    headers['X-Frame-Options'] = buildXFrame(input.xFrame);
  }

  if (input.xContentTypeOptions) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }

  if (input.referrerPolicy) {
    headers['Referrer-Policy'] = input.referrerPolicy;
  }

  if (input.permissionsPolicy) {
    headers['Permissions-Policy'] = buildPermissionsPolicy(input.permissionsPolicy);
  }

  return { headers };
}

function buildHsts(hsts: HstsOptions): string {
  if (hsts.maxAgeSec < 0) {
    throw new Error(`hsts: maxAgeSec must be >= 0 (got ${hsts.maxAgeSec})`);
  }
  if (hsts.preload && (!hsts.includeSubDomains || hsts.maxAgeSec < 31_536_000)) {
    throw new Error(
      'hsts: preload requires includeSubDomains + maxAgeSec >= 31536000 (1 year) per Chrome policy',
    );
  }
  const parts = [`max-age=${hsts.maxAgeSec}`];
  if (hsts.includeSubDomains) parts.push('includeSubDomains');
  if (hsts.preload) parts.push('preload');
  return parts.join('; ');
}

function buildXFrame(opt: XFrameOption): string {
  switch (opt.mode) {
    case 'DENY':
      return 'DENY';
    case 'SAMEORIGIN':
      return 'SAMEORIGIN';
    case 'ALLOW-FROM':
      return `ALLOW-FROM ${opt.uri}`;
  }
}

function buildPermissionsPolicy(
  policy: Partial<Record<PermissionsFeature, PermissionsSource>>,
): string {
  const parts: string[] = [];
  for (const [feature, source] of Object.entries(policy)) {
    if (source === undefined) continue;
    parts.push(`${feature}=${formatPermissionsSource(source)}`);
  }
  return parts.join(', ');
}

function formatPermissionsSource(source: PermissionsSource): string {
  if (source === '*') return '*';
  if (source === 'self') return '(self)';
  if (source === 'none') return '()';
  const inner = source.origins.map((o) => `"${o}"`).join(' ');
  return `(${inner})`;
}

/**
 * Header header 値の syntactic validation。 実 browser 実装との fidelity は
 * fidelity harness 側で確認、 ここでは build 段階の misuse だけ検知。
 */
export function validateSecurityHeaders(input: SecurityHeadersInput): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (input.hsts && input.hsts.preload && !input.hsts.includeSubDomains) {
    errors.push('hsts: preload requires includeSubDomains');
  }
  if (input.hsts && input.hsts.preload && input.hsts.maxAgeSec < 31_536_000) {
    errors.push('hsts: preload requires maxAgeSec >= 31536000 (1 year)');
  }
  if (input.referrerPolicy && !VALID_REFERRER_POLICIES.has(input.referrerPolicy)) {
    errors.push(`referrer-policy: invalid value ${input.referrerPolicy}`);
  }
  return { ok: errors.length === 0, errors };
}

const VALID_REFERRER_POLICIES = new Set<ReferrerPolicyValue>([
  'no-referrer',
  'no-referrer-when-downgrade',
  'origin',
  'origin-when-cross-origin',
  'same-origin',
  'strict-origin',
  'strict-origin-when-cross-origin',
  'unsafe-url',
]);

export function toSecurityHeadersEvent(input: {
  provider: 'helmet';
  verdict: 'allow' | 'warn' | 'deny';
  reason: string;
  payload: unknown;
  timestamp: number;
}): SecurityEvent {
  return {
    axis: 'security-headers',
    provider: input.provider,
    verdict: input.verdict,
    reason: input.reason,
    payload: input.payload,
    timestamp: input.timestamp,
  };
}
