import {
  providerAdvEventName,
  type AxisAdvStep,
  type NeutralAdvEventName,
  type SecurityAdvTarget,
} from './types.js';

/**
 * Web Vitals security axis — Subresource Integrity (SRI) hash + Trusted Types +
 * Permissions Policy + Cross-Origin Isolation (COOP/COEP) enforcement state
 * machine。
 *
 * Deterministic mock で 4 signal 系統を提供。 real driver 経路では headless
 * browser (Playwright) に対して response header を発火する。
 */

export type WvsState =
  | 'idle'
  | 'sri-verified'
  | 'trusted-types-enforced'
  | 'permissions-policy-applied'
  | 'cross-origin-isolated'
  | 'failed';

export interface WvsSession {
  target: SecurityAdvTarget;
  sessionId: string;
  state: WvsState;
  history: AxisAdvStep<WvsState>[];
}

export interface SriInput {
  resourceUrl: string;
  integrity: string;
  computedHash: string;
}

export interface TrustedTypesInput {
  policyNames: string[];
  requireForScript: boolean;
  reportOnly: boolean;
}

export interface PermissionsPolicyInput {
  features: Array<{
    name: 'camera' | 'microphone' | 'geolocation' | 'payment' | 'usb' | 'gyroscope';
    allowlist: 'none' | 'self' | 'src' | string;
  }>;
}

export interface CrossOriginInput {
  coop: 'unsafe-none' | 'same-origin' | 'same-origin-allow-popups';
  coep: 'unsafe-none' | 'require-corp' | 'credentialless';
  corp: 'same-site' | 'same-origin' | 'cross-origin';
}

export function startWvsSession(input: {
  target: SecurityAdvTarget;
  sessionId: string;
}): WvsSession {
  if (input.sessionId.length === 0) {
    throw new Error('startWvsSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
  };
}

export function verifySri(session: WvsSession, input: SriInput): AxisAdvStep<WvsState> {
  if (session.state !== 'idle' && session.state !== 'sri-verified') {
    throw new Error(`verifySri: session is ${session.state}`);
  }
  if (input.integrity.length === 0 || input.computedHash.length === 0) {
    throw new Error('verifySri: integrity and computedHash must not be empty');
  }
  if (!/^sha(256|384|512)-/.test(input.integrity)) {
    throw new Error('verifySri: integrity must start with sha256- / sha384- / sha512-');
  }
  const expected = input.integrity.split('-')[1] ?? '';
  const matched = expected === input.computedHash;
  session.state = matched ? 'sri-verified' : 'failed';
  return emit(session, 'wvs.sri_hash_verified', {
    resourceUrl: input.resourceUrl,
    matched,
    algorithm: input.integrity.split('-')[0] ?? 'sha256',
  });
}

export function enforceTrustedTypes(
  session: WvsSession,
  input: TrustedTypesInput,
): AxisAdvStep<WvsState> {
  if (session.state !== 'sri-verified') {
    throw new Error('enforceTrustedTypes: SRI must be verified first');
  }
  if (input.policyNames.length === 0) {
    throw new Error('enforceTrustedTypes: at least one policy name required');
  }
  session.state = 'trusted-types-enforced';
  return emit(session, 'wvs.trusted_types_enforced', {
    policyCount: input.policyNames.length,
    requireForScript: input.requireForScript,
    reportOnly: input.reportOnly,
  });
}

export function applyPermissionsPolicy(
  session: WvsSession,
  input: PermissionsPolicyInput,
): AxisAdvStep<WvsState> {
  if (session.state !== 'trusted-types-enforced') {
    throw new Error('applyPermissionsPolicy: trusted types must be enforced first');
  }
  if (input.features.length === 0) {
    throw new Error('applyPermissionsPolicy: at least one feature required');
  }
  const restrictedCount = input.features.filter((f) => f.allowlist === 'none').length;
  session.state = 'permissions-policy-applied';
  return emit(session, 'wvs.permissions_policy_applied', {
    featureCount: input.features.length,
    restrictedCount,
  });
}

export function enforceCrossOriginIsolation(
  session: WvsSession,
  input: CrossOriginInput,
): AxisAdvStep<WvsState> {
  if (session.state !== 'permissions-policy-applied') {
    throw new Error('enforceCrossOriginIsolation: permissions policy must be applied first');
  }
  const isolated =
    input.coop === 'same-origin' &&
    (input.coep === 'require-corp' || input.coep === 'credentialless');
  session.state = 'cross-origin-isolated';
  return emit(session, 'wvs.cross_origin_isolated', {
    coop: input.coop,
    coep: input.coep,
    corp: input.corp,
    isolated,
  });
}

function emit(
  session: WvsSession,
  neutral: NeutralAdvEventName,
  metadata: Record<string, string | number | boolean>,
): AxisAdvStep<WvsState> {
  const step: AxisAdvStep<WvsState> = {
    neutralEvent: neutral,
    providerEvent: providerAdvEventName(session.target, neutral),
    state: session.state,
    timestampMs: session.history.length + 1,
    metadata,
  };
  session.history.push(step);
  return step;
}
