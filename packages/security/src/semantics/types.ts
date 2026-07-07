/**
 * Advanced Security semantics — provider-neutral axis SSOT (v0.2).
 *
 * Model 4 canonical security provider targets as pure state machines so kiwa
 * fixture tests can assert on a neutral event name while still observing a
 * provider-specific dialect through providerEventName.
 *
 * Provider targets (SDK 別 4):
 * - istio ... Istio service mesh (mTLS + AuthorizationPolicy + PeerAuthentication)
 * - opa ... Open Policy Agent (rego policy + zero-trust + admission control)
 * - siem-splunk ... Splunk Enterprise SIEM (structured audit log + correlation)
 * - vault ... HashiCorp Vault (KDF + envelope + key rotation + HSM 経路)
 *
 * Axes (8):
 * - mtls ... mutual TLS + certificate pinning + OCSP stapling + CT log
 * - zero-trust ... device posture + risk score + JIT + micro-segmentation
 * - siem-audit ... structured + tamper-evident + retention + correlation rule
 * - incident-response ... playbook + severity + escalation + forensics + post-mortem
 * - crypto-advanced ... AEAD + KDF + envelope + key rotation + HSM + post-quantum
 * - container-k8s ... pod security policy + network policy + admission controller
 * - supply-chain ... SLSA level + reproducible build + signed provenance + attestation
 * - web-vitals-security ... SRI + trusted types + permissions policy + cross-origin isolation
 */

export type SecurityAdvTarget = 'istio' | 'opa' | 'siem-splunk' | 'vault';

export type SecurityAdvAxis =
  | 'mtls'
  | 'zero-trust'
  | 'siem-audit'
  | 'incident-response'
  | 'crypto-advanced'
  | 'container-k8s'
  | 'supply-chain'
  | 'web-vitals-security';

export type NeutralAdvEventName =
  // mtls
  | 'mtls.handshake_completed'
  | 'mtls.cert_pinned'
  | 'mtls.ocsp_verified'
  | 'mtls.ct_log_checked'
  // zero-trust
  | 'zt.device_posture_evaluated'
  | 'zt.risk_scored'
  | 'zt.jit_granted'
  | 'zt.micro_segment_enforced'
  // siem-audit
  | 'siem.event_structured'
  | 'siem.tamper_evident_sealed'
  | 'siem.retention_applied'
  | 'siem.correlation_matched'
  // incident-response
  | 'ir.playbook_triggered'
  | 'ir.severity_classified'
  | 'ir.escalation_sent'
  | 'ir.forensics_captured'
  | 'ir.post_mortem_recorded'
  // crypto-advanced
  | 'crypto.aead_sealed'
  | 'crypto.kdf_derived'
  | 'crypto.envelope_wrapped'
  | 'crypto.key_rotated'
  | 'crypto.hsm_signed'
  | 'crypto.pq_kem_encapsulated'
  // container-k8s
  | 'k8s.pod_security_enforced'
  | 'k8s.network_policy_applied'
  | 'k8s.admission_denied'
  | 'k8s.admission_allowed'
  // supply-chain
  | 'sc.slsa_level_verified'
  | 'sc.reproducible_build_matched'
  | 'sc.provenance_signed'
  | 'sc.attestation_verified'
  // web-vitals-security
  | 'wvs.sri_hash_verified'
  | 'wvs.trusted_types_enforced'
  | 'wvs.permissions_policy_applied'
  | 'wvs.cross_origin_isolated';

export interface AxisAdvStep<TState extends string> {
  neutralEvent: NeutralAdvEventName;
  providerEvent: string;
  state: TState;
  timestampMs: number;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<SecurityAdvTarget, Partial<Record<NeutralAdvEventName, string>>> = {
  istio: {
    'mtls.handshake_completed': 'istio.mtls.handshake',
    'mtls.cert_pinned': 'istio.mtls.pin',
    'mtls.ocsp_verified': 'istio.mtls.ocsp',
    'mtls.ct_log_checked': 'istio.mtls.ct',
    'zt.device_posture_evaluated': 'istio.zt.posture',
    'zt.risk_scored': 'istio.zt.risk',
    'zt.jit_granted': 'istio.zt.jit',
    'zt.micro_segment_enforced': 'istio.zt.segment',
    'siem.event_structured': 'istio.siem.structured',
    'siem.tamper_evident_sealed': 'istio.siem.sealed',
    'siem.retention_applied': 'istio.siem.retention',
    'siem.correlation_matched': 'istio.siem.correlation',
    'ir.playbook_triggered': 'istio.ir.playbook',
    'ir.severity_classified': 'istio.ir.severity',
    'ir.escalation_sent': 'istio.ir.escalation',
    'ir.forensics_captured': 'istio.ir.forensics',
    'ir.post_mortem_recorded': 'istio.ir.post_mortem',
    'crypto.aead_sealed': 'istio.crypto.aead',
    'crypto.kdf_derived': 'istio.crypto.kdf',
    'crypto.envelope_wrapped': 'istio.crypto.envelope',
    'crypto.key_rotated': 'istio.crypto.rotate',
    'crypto.hsm_signed': 'istio.crypto.hsm',
    'crypto.pq_kem_encapsulated': 'istio.crypto.pq',
    'k8s.pod_security_enforced': 'istio.k8s.pod',
    'k8s.network_policy_applied': 'istio.k8s.netpol',
    'k8s.admission_denied': 'istio.k8s.deny',
    'k8s.admission_allowed': 'istio.k8s.allow',
    'sc.slsa_level_verified': 'istio.sc.slsa',
    'sc.reproducible_build_matched': 'istio.sc.reprod',
    'sc.provenance_signed': 'istio.sc.provenance',
    'sc.attestation_verified': 'istio.sc.attestation',
    'wvs.sri_hash_verified': 'istio.wvs.sri',
    'wvs.trusted_types_enforced': 'istio.wvs.tt',
    'wvs.permissions_policy_applied': 'istio.wvs.pp',
    'wvs.cross_origin_isolated': 'istio.wvs.coi',
  },
  opa: {
    'mtls.handshake_completed': 'opa.mtls.handshake',
    'mtls.cert_pinned': 'opa.mtls.pin',
    'mtls.ocsp_verified': 'opa.mtls.ocsp',
    'mtls.ct_log_checked': 'opa.mtls.ct',
    'zt.device_posture_evaluated': 'opa.zt.posture',
    'zt.risk_scored': 'opa.zt.risk',
    'zt.jit_granted': 'opa.zt.jit',
    'zt.micro_segment_enforced': 'opa.zt.segment',
    'siem.event_structured': 'opa.siem.structured',
    'siem.tamper_evident_sealed': 'opa.siem.sealed',
    'siem.retention_applied': 'opa.siem.retention',
    'siem.correlation_matched': 'opa.siem.correlation',
    'ir.playbook_triggered': 'opa.ir.playbook',
    'ir.severity_classified': 'opa.ir.severity',
    'ir.escalation_sent': 'opa.ir.escalation',
    'ir.forensics_captured': 'opa.ir.forensics',
    'ir.post_mortem_recorded': 'opa.ir.post_mortem',
    'crypto.aead_sealed': 'opa.crypto.aead',
    'crypto.kdf_derived': 'opa.crypto.kdf',
    'crypto.envelope_wrapped': 'opa.crypto.envelope',
    'crypto.key_rotated': 'opa.crypto.rotate',
    'crypto.hsm_signed': 'opa.crypto.hsm',
    'crypto.pq_kem_encapsulated': 'opa.crypto.pq',
    'k8s.pod_security_enforced': 'opa.k8s.pod',
    'k8s.network_policy_applied': 'opa.k8s.netpol',
    'k8s.admission_denied': 'opa.k8s.deny',
    'k8s.admission_allowed': 'opa.k8s.allow',
    'sc.slsa_level_verified': 'opa.sc.slsa',
    'sc.reproducible_build_matched': 'opa.sc.reprod',
    'sc.provenance_signed': 'opa.sc.provenance',
    'sc.attestation_verified': 'opa.sc.attestation',
    'wvs.sri_hash_verified': 'opa.wvs.sri',
    'wvs.trusted_types_enforced': 'opa.wvs.tt',
    'wvs.permissions_policy_applied': 'opa.wvs.pp',
    'wvs.cross_origin_isolated': 'opa.wvs.coi',
  },
  'siem-splunk': {
    'mtls.handshake_completed': 'splunk.mtls.handshake',
    'mtls.cert_pinned': 'splunk.mtls.pin',
    'mtls.ocsp_verified': 'splunk.mtls.ocsp',
    'mtls.ct_log_checked': 'splunk.mtls.ct',
    'zt.device_posture_evaluated': 'splunk.zt.posture',
    'zt.risk_scored': 'splunk.zt.risk',
    'zt.jit_granted': 'splunk.zt.jit',
    'zt.micro_segment_enforced': 'splunk.zt.segment',
    'siem.event_structured': 'splunk.siem.structured',
    'siem.tamper_evident_sealed': 'splunk.siem.sealed',
    'siem.retention_applied': 'splunk.siem.retention',
    'siem.correlation_matched': 'splunk.siem.correlation',
    'ir.playbook_triggered': 'splunk.ir.playbook',
    'ir.severity_classified': 'splunk.ir.severity',
    'ir.escalation_sent': 'splunk.ir.escalation',
    'ir.forensics_captured': 'splunk.ir.forensics',
    'ir.post_mortem_recorded': 'splunk.ir.post_mortem',
    'crypto.aead_sealed': 'splunk.crypto.aead',
    'crypto.kdf_derived': 'splunk.crypto.kdf',
    'crypto.envelope_wrapped': 'splunk.crypto.envelope',
    'crypto.key_rotated': 'splunk.crypto.rotate',
    'crypto.hsm_signed': 'splunk.crypto.hsm',
    'crypto.pq_kem_encapsulated': 'splunk.crypto.pq',
    'k8s.pod_security_enforced': 'splunk.k8s.pod',
    'k8s.network_policy_applied': 'splunk.k8s.netpol',
    'k8s.admission_denied': 'splunk.k8s.deny',
    'k8s.admission_allowed': 'splunk.k8s.allow',
    'sc.slsa_level_verified': 'splunk.sc.slsa',
    'sc.reproducible_build_matched': 'splunk.sc.reprod',
    'sc.provenance_signed': 'splunk.sc.provenance',
    'sc.attestation_verified': 'splunk.sc.attestation',
    'wvs.sri_hash_verified': 'splunk.wvs.sri',
    'wvs.trusted_types_enforced': 'splunk.wvs.tt',
    'wvs.permissions_policy_applied': 'splunk.wvs.pp',
    'wvs.cross_origin_isolated': 'splunk.wvs.coi',
  },
  vault: {
    'mtls.handshake_completed': 'vault.mtls.handshake',
    'mtls.cert_pinned': 'vault.mtls.pin',
    'mtls.ocsp_verified': 'vault.mtls.ocsp',
    'mtls.ct_log_checked': 'vault.mtls.ct',
    'zt.device_posture_evaluated': 'vault.zt.posture',
    'zt.risk_scored': 'vault.zt.risk',
    'zt.jit_granted': 'vault.zt.jit',
    'zt.micro_segment_enforced': 'vault.zt.segment',
    'siem.event_structured': 'vault.siem.structured',
    'siem.tamper_evident_sealed': 'vault.siem.sealed',
    'siem.retention_applied': 'vault.siem.retention',
    'siem.correlation_matched': 'vault.siem.correlation',
    'ir.playbook_triggered': 'vault.ir.playbook',
    'ir.severity_classified': 'vault.ir.severity',
    'ir.escalation_sent': 'vault.ir.escalation',
    'ir.forensics_captured': 'vault.ir.forensics',
    'ir.post_mortem_recorded': 'vault.ir.post_mortem',
    'crypto.aead_sealed': 'vault.crypto.aead',
    'crypto.kdf_derived': 'vault.crypto.kdf',
    'crypto.envelope_wrapped': 'vault.crypto.envelope',
    'crypto.key_rotated': 'vault.crypto.rotate',
    'crypto.hsm_signed': 'vault.crypto.hsm',
    'crypto.pq_kem_encapsulated': 'vault.crypto.pq',
    'k8s.pod_security_enforced': 'vault.k8s.pod',
    'k8s.network_policy_applied': 'vault.k8s.netpol',
    'k8s.admission_denied': 'vault.k8s.deny',
    'k8s.admission_allowed': 'vault.k8s.allow',
    'sc.slsa_level_verified': 'vault.sc.slsa',
    'sc.reproducible_build_matched': 'vault.sc.reprod',
    'sc.provenance_signed': 'vault.sc.provenance',
    'sc.attestation_verified': 'vault.sc.attestation',
    'wvs.sri_hash_verified': 'vault.wvs.sri',
    'wvs.trusted_types_enforced': 'vault.wvs.tt',
    'wvs.permissions_policy_applied': 'vault.wvs.pp',
    'wvs.cross_origin_isolated': 'vault.wvs.coi',
  },
};

export function providerAdvEventName(
  target: SecurityAdvTarget,
  neutral: NeutralAdvEventName,
): string {
  return dialect[target][neutral] ?? neutral;
}
