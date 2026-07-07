import {
  providerAdvEventName,
  type NeutralAdvEventName,
  type SecurityAdvAxis,
  type SecurityAdvTarget,
} from './types.js';

/**
 * 4 provider × 8 axis = 32 combination advanced fidelity grid (v0.2)。
 *
 * v0.1 の `SECURITY_FIDELITY_GRID` は provider {helmet / express-rate-limit
 * / casbin / coraza} × 基礎 8 axis を扱う。 本 v0.2 grid は provider
 * {istio / opa / siem-splunk / vault} × 高度 8 axis を扱い、
 * `SECURITY_FIDELITY_GRID` と直交する 2 段目の grid 構造。
 */

export interface AdvFidelityRow {
  provider: SecurityAdvTarget;
  axis: SecurityAdvAxis;
  neutralEvents: NeutralAdvEventName[];
  providerEvents: string[];
}

export interface AdvFidelityCoverage {
  providers: SecurityAdvTarget[];
  axes: SecurityAdvAxis[];
  rows: AdvFidelityRow[];
}

export const SECURITY_ADV_AXIS_TO_EVENTS: Record<SecurityAdvAxis, NeutralAdvEventName[]> = {
  mtls: [
    'mtls.handshake_completed',
    'mtls.cert_pinned',
    'mtls.ocsp_verified',
    'mtls.ct_log_checked',
  ],
  'zero-trust': [
    'zt.device_posture_evaluated',
    'zt.risk_scored',
    'zt.jit_granted',
    'zt.micro_segment_enforced',
  ],
  'siem-audit': [
    'siem.event_structured',
    'siem.tamper_evident_sealed',
    'siem.retention_applied',
    'siem.correlation_matched',
  ],
  'incident-response': [
    'ir.playbook_triggered',
    'ir.severity_classified',
    'ir.escalation_sent',
    'ir.forensics_captured',
    'ir.post_mortem_recorded',
  ],
  'crypto-advanced': [
    'crypto.aead_sealed',
    'crypto.kdf_derived',
    'crypto.envelope_wrapped',
    'crypto.key_rotated',
    'crypto.hsm_signed',
    'crypto.pq_kem_encapsulated',
  ],
  'container-k8s': [
    'k8s.pod_security_enforced',
    'k8s.network_policy_applied',
    'k8s.admission_denied',
    'k8s.admission_allowed',
  ],
  'supply-chain': [
    'sc.slsa_level_verified',
    'sc.reproducible_build_matched',
    'sc.provenance_signed',
    'sc.attestation_verified',
  ],
  'web-vitals-security': [
    'wvs.sri_hash_verified',
    'wvs.trusted_types_enforced',
    'wvs.permissions_policy_applied',
    'wvs.cross_origin_isolated',
  ],
};

export function collectAdvFidelityCoverage(
  providers: SecurityAdvTarget[] = ['istio', 'opa', 'siem-splunk', 'vault'],
): AdvFidelityCoverage {
  const axes = Object.keys(SECURITY_ADV_AXIS_TO_EVENTS) as SecurityAdvAxis[];
  const rows: AdvFidelityRow[] = [];
  for (const provider of providers) {
    for (const axis of axes) {
      const neutralEvents = SECURITY_ADV_AXIS_TO_EVENTS[axis];
      const providerEvents = neutralEvents.map((event) => providerAdvEventName(provider, event));
      rows.push({ provider, axis, neutralEvents, providerEvents });
    }
  }
  return { providers, axes, rows };
}

/** provider × axis = 4 × 8 = 32 grid の SSOT 列挙。 */
export const SECURITY_ADV_FIDELITY_GRID: Array<{
  provider: SecurityAdvTarget;
  axis: SecurityAdvAxis;
}> = (() => {
  const providers: SecurityAdvTarget[] = ['istio', 'opa', 'siem-splunk', 'vault'];
  const axes: SecurityAdvAxis[] = [
    'mtls',
    'zero-trust',
    'siem-audit',
    'incident-response',
    'crypto-advanced',
    'container-k8s',
    'supply-chain',
    'web-vitals-security',
  ];
  const out: Array<{ provider: SecurityAdvTarget; axis: SecurityAdvAxis }> = [];
  for (const provider of providers) {
    for (const axis of axes) {
      out.push({ provider, axis });
    }
  }
  return out;
})();
