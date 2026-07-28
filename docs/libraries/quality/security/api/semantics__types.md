---
title: "@kiwa-lab/security semantics__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>providerAdvEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L241) <code v-pre>packages/security/src/semantics/types.ts</code>

```ts
export declare function providerAdvEventName(target: SecurityAdvTarget, neutral: NeutralAdvEventName): string;
```

### 型

#### <code v-pre>AxisAdvStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L82) <code v-pre>packages/security/src/semantics/types.ts</code>

```ts
export interface AxisAdvStep<TState extends string> {
    neutralEvent: NeutralAdvEventName;
    providerEvent: string;
    state: TState;
    timestampMs: number;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>NeutralAdvEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L37) <code v-pre>packages/security/src/semantics/types.ts</code>

```ts
export type NeutralAdvEventName = 'mtls.handshake_completed' | 'mtls.cert_pinned' | 'mtls.ocsp_verified' | 'mtls.ct_log_checked' | 'zt.device_posture_evaluated' | 'zt.risk_scored' | 'zt.jit_granted' | 'zt.micro_segment_enforced' | 'siem.event_structured' | 'siem.tamper_evident_sealed' | 'siem.retention_applied' | 'siem.correlation_matched' | 'ir.playbook_triggered' | 'ir.severity_classified' | 'ir.escalation_sent' | 'ir.forensics_captured' | 'ir.post_mortem_recorded' | 'crypto.aead_sealed' | 'crypto.kdf_derived' | 'crypto.envelope_wrapped' | 'crypto.key_rotated' | 'crypto.hsm_signed' | 'crypto.pq_kem_encapsulated' | 'k8s.pod_security_enforced' | 'k8s.network_policy_applied' | 'k8s.admission_denied' | 'k8s.admission_allowed' | 'sc.slsa_level_verified' | 'sc.reproducible_build_matched' | 'sc.provenance_signed' | 'sc.attestation_verified' | 'wvs.sri_hash_verified' | 'wvs.trusted_types_enforced' | 'wvs.permissions_policy_applied' | 'wvs.cross_origin_isolated';
```

#### <code v-pre>SecurityAdvAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L27) <code v-pre>packages/security/src/semantics/types.ts</code>

```ts
export type SecurityAdvAxis = 'mtls' | 'zero-trust' | 'siem-audit' | 'incident-response' | 'crypto-advanced' | 'container-k8s' | 'supply-chain' | 'web-vitals-security';
```

#### <code v-pre>SecurityAdvTarget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L25) <code v-pre>packages/security/src/semantics/types.ts</code>

Advanced Security semantics — provider-neutral axis SSOT (v0.2). Model 4 canonical security provider targets as pure state machines so kiwa fixture tests can assert on a neutral event name while still observing a provider-specific dialect through providerEventName. Provider targets (SDK 別 4): - istio ... Istio service mesh (mTLS + AuthorizationPolicy + PeerAuthentication) - opa ... Open Policy Agent (rego policy + zero-trust + admission control) - siem-splunk ... Splunk Enterprise SIEM (structured audit log + correlation) - vault ... HashiCorp Vault (KDF + envelope + key rotation + HSM 経路) Axes (8): - mtls ... mutual TLS + certificate pinning + OCSP stapling + CT log - zero-trust ... device posture + risk score + JIT + micro-segmentation - siem-audit ... structured + tamper-evident + retention + correlation rule - incident-response ... playbook + severity + escalation + forensics + post-mortem - crypto-advanced ... AEAD + KDF + envelope + key rotation + HSM + post-quantum - container-k8s ... pod security policy + network policy + admission controller - supply-chain ... SLSA level + reproducible build + signed provenance + attestation - web-vitals-security ... SRI + trusted types + permissions policy + cross-origin isolation

```ts
export type SecurityAdvTarget = 'istio' | 'opa' | 'siem-splunk' | 'vault';
```
