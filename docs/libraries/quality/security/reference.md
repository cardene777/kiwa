# Security リファレンス

`@kiwa-lab/security` は runtime security の各 axis を独立した API で提供します。

## Header と認可

`buildCspHeader` と `validateNonce` は CSP を作成します。`buildSecurityHeaders` と `validateSecurityHeaders` は HSTS、frame、referrer、permissions policy を扱います。

`TokenBucket`、`LeakyBucket`、`SlidingWindow`、`DistributedRateLimiter` は rate limit の decision を返します。`createRbacPolicy`、`rbacAllows`、`evaluateAbac`、`evaluateCombined` は認可を評価します。

## 検査と fidelity

`createWafPolicy` と `evaluateWaf` は OWASP CRS を含む WAF rule を評価します。`scanSecrets`、`toCycloneDx`、`toSpdx`、`validateSbom` は secret と supply chain を扱います。`runSecurityFidelityCheck` は real と mock の event を比較します。

## 実行条件と後始末

real driver は `KIWA_MODE=real` と provider ごとの必須環境変数があるときだけ選択します。`skipUnlessReal` で実行条件を確認できます。in-memory limiter、policy、tracker はテスト間で共有せず、必要なら新しい instance を作ります。

rate limit は Token Bucket、Leaky Bucket、Sliding Window、Distributed Rate Limiter の decision を返します。authorization は RBAC、ABAC、combined policy、WAF は既定 OWASP CRS と custom rule を評価します。各 API は実 Casbin、Coraza、SIEM、Vault への要求を送信しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `rbac: role hierarchy cycle detected at "${name}"` | [packages/security/src/authorization.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L43) |
| "csp: strict-dynamic requires at least one nonce or hash in script-src (otherwise the whole policy has no effect)" | [packages/security/src/csp.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L146) |
| 'sliding-window: windowMs must be > 0' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L147) |
| 'sliding-window: maxRequests must be > 0' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L150) |
| 'distributed: shards must be > 0' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L196) |
| 'client-id: ip missing' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L244) |
| 'client-id: userId missing' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L247) |
| 'client-id: apiKey missing' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L250) |
| 'token-bucket: capacity must be > 0' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L38) |
| 'token-bucket: refillPerMs must be > 0' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L41) |
| 'leaky-bucket: capacity must be > 0' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L92) |
| 'leaky-bucket: drainPerMs must be > 0' | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L95) |
| `hsts: maxAgeSec must be >= 0 (got ${hsts.maxAgeSec})` | [packages/security/src/security-headers.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L106) |
| 'hsts: preload requires includeSubDomains + maxAgeSec >= 31536000 (1 year) per Chrome policy' | [packages/security/src/security-headers.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L109) |
| 'applyNetworkPolicy: pod security must be enforced first' | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L107) |
| 'applyNetworkPolicy: podSelector must not be empty' | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L110) |
| 'decideAdmission: network policy must be applied first' | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L127) |
| 'startK8sSession: sessionId must not be empty' | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L61) |
| `enforcePodSecurity: session is ${session.state}` | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L78) |
| 'deriveKey: salt must be >= 8 bytes' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L107) |
| 'deriveKey: iterations must be >= 1' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L110) |
| 'deriveKey: password-based KDF requires >= 10000 iterations' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L113) |
| 'wrapEnvelope: cek and kek must not be empty' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L129) |
| 'rotateKey: oldKeyId and newKeyId must differ' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L144) |
| 'rotateKey: key ids must not be empty' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L147) |
| 'signWithHsm: digest must not be empty' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L163) |
| 'signWithHsm: keyId must not be empty' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L166) |
| 'encapsulatePq: ML-KEM public key must be >= 800 bytes' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L181) |
| 'startCryptoSession: sessionId must not be empty' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L78) |
| 'sealAead: lengths must be non-negative' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L91) |
| 'sealAead: plaintext > 64MB not supported by mock' | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L94) |
| 'classifySeverity: playbook must be triggered first' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L108) |
| 'classifySeverity: affectedUsers must be non-negative' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L111) |
| 'escalate: severity must be classified first' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L135) |
| 'escalate: at least one channel required' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L138) |
| 'escalate: primary on-call must be assigned' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L141) |
| 'captureForensics: escalation must complete first' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L157) |
| 'captureForensics: artifact sizes must be non-negative' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L160) |
| 'recordPostMortem: forensics must be captured first' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L179) |
| 'recordPostMortem: rootCause must be >= 10 chars' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L182) |
| 'recordPostMortem: must have >= 1 action item' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L185) |
| 'startIncidentSession: sessionId must not be empty' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L71) |
| `triggerPlaybook: session is ${session.state}, must be idle` | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L89) |
| 'triggerPlaybook: playbookId must not be empty' | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L92) |
| `verifyOcsp: session is ${session.state}, need handshake / pin first` | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L113) |
| `checkCtLog: session is ${session.state}, must have handshake first` | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L128) |
| 'checkCtLog: minSctRequired must be non-negative' | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L131) |
| 'startMtlsSession: sessionId must not be empty' | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L59) |
| `completeHandshake: session is ${session.state}, cannot handshake` | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L75) |
| 'completeHandshake: only TLS 1.2 / 1.3 supported' | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L78) |
| `verifyPin: session is ${session.state}, must have completed handshake` | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L90) |
| 'verifyPin: expectedPins must not be empty' | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L93) |
| 'sealEvents: no structured events to seal' | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L106) |
| 'sealEvents: 0 structured events, cannot seal empty batch' | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L109) |
| 'applyRetention: events must be sealed first' | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L127) |
| 'applyRetention: retention days must be non-negative' | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L130) |
| 'correlate: retention must be applied first' | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L148) |
| 'correlate: rule must require >= 1 event id' | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L151) |
| 'startSiemAuditSession: sessionId must not be empty' | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L63) |
| `structureEvent: session is ${session.state}, cannot structure` | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L80) |
| 'structureEvent: actor / action / target must not be empty' | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L83) |
| 'matchReproducibleBuild: SLSA level must be verified first' | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L111) |
| 'matchReproducibleBuild: build hashes must not be empty' | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L114) |
| 'signProvenance: reproducible build must be matched first' | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L131) |
| 'signProvenance: builderId must not be empty' | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L134) |
| 'signProvenance: materialsCount must be non-negative' | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L137) |
| 'verifyAttestation: provenance must be signed first' | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L152) |
| 'verifyAttestation: trustRootFingerprint must not be empty' | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L155) |
| 'verifyAttestation: at least one valid signature required' | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L158) |
| 'startSupplyChainSession: sessionId must not be empty' | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L67) |
| `verifySlsaLevel: session is ${session.state}` | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L83) |
| 'enforceTrustedTypes: at least one policy name required' | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L100) |
| 'applyPermissionsPolicy: trusted types must be enforced first' | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L115) |
| 'applyPermissionsPolicy: at least one feature required' | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L118) |
| 'enforceCrossOriginIsolation: permissions policy must be applied first' | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L133) |
| 'startWvsSession: sessionId must not be empty' | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L62) |
| `verifySri: session is ${session.state}` | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L74) |
| 'verifySri: integrity and computedHash must not be empty' | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L77) |
| 'verifySri: integrity must start with sha256- / sha384- / sha512-' | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L80) |
| 'enforceTrustedTypes: SRI must be verified first' | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L97) |
| 'requestJit: risk must be scored first' | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L122) |
| 'requestJit: ttlSeconds must be 1..3600' | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L125) |
| 'requestJit: justification must be >= 10 chars' | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L128) |
| 'enforceMicroSegment: JIT must be granted first' | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L150) |
| 'startZeroTrustSession: sessionId must not be empty' | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L58) |
| `evaluatePosture: session is ${session.state}, must be idle` | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L75) |
| 'scoreRisk: posture must be evaluated first' | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L99) |
| `dread: factor out of range (${v}); must be 1..10` | [packages/security/src/threat-model.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L126) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/security/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `addCustomRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L90) `packages/security/src/waf.ts`

```ts
export declare function addCustomRule(policy: WafPolicy, rule: WafRule): WafPolicy;
```

#### `ADV_API_KEY_ENV_KEY`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L24) `packages/security/src/semantics/real-driver.ts`

```ts
export declare const ADV_API_KEY_ENV_KEY: Record<SecurityAdvTarget, string>;
```

#### `ADV_ENDPOINT_ENV_KEY`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L17) `packages/security/src/semantics/real-driver.ts`

```ts
export declare const ADV_ENDPOINT_ENV_KEY: Record<SecurityAdvTarget, string>;
```

#### `ADV_REQUIRED_KEYS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L31) `packages/security/src/semantics/real-driver.ts`

```ts
export declare const ADV_REQUIRED_KEYS: Record<SecurityAdvTarget, string[]>;
```

#### `applyNetworkPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L102) `packages/security/src/semantics/container-k8s.ts`

```ts
export declare function applyNetworkPolicy(session: K8sSession, policy: NetworkPolicySpec): AxisAdvStep<K8sState>;
```

#### `applyPermissionsPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L110) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export declare function applyPermissionsPolicy(session: WvsSession, input: PermissionsPolicyInput): AxisAdvStep<WvsState>;
```

#### `applyRetention`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L122) `packages/security/src/semantics/siem-audit.ts`

```ts
export declare function applyRetention(session: SiemAuditSession, policy: RetentionPolicy): AxisAdvStep<SiemAuditState>;
```

#### `buildAdvRealDriverConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L101) `packages/security/src/semantics/real-driver.ts`

```ts
export declare function buildAdvRealDriverConfig(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): AdvRealDriverConfig;
```

#### `buildCspHeader`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L106) `packages/security/src/csp.ts`

CSP header を SSOT 定義から build する。 nonce / hash / strict-dynamic は 5 sub-axis の中で最も間違えやすい組合せ (nonce が同 header 内 2 回以上 出ると browser reject / strict-dynamic は nonce or hash なしに書くと whole policy が effect なし) を build 段階で予防する。

```ts
export declare function buildCspHeader(input: CspPolicyInput): CspHeaderOutput;
```

#### `buildSecurityHeaders`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L78) `packages/security/src/security-headers.ts`

```ts
export declare function buildSecurityHeaders(input: SecurityHeadersInput): SecurityHeadersOutput;
```

#### `captureForensics`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L152) `packages/security/src/semantics/incident-response.ts`

```ts
export declare function captureForensics(session: IncidentSession, input: ForensicsInput): AxisAdvStep<IncidentState>;
```

#### `checkCtLog`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L126) `packages/security/src/semantics/mtls.ts`

```ts
export declare function checkCtLog(session: MtlsSession, input: CtLogInput): AxisAdvStep<MtlsState>;
```

#### `classifySeverity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L103) `packages/security/src/semantics/incident-response.ts`

```ts
export declare function classifySeverity(session: IncidentSession, input: SeverityInput): AxisAdvStep<IncidentState>;
```

#### `collectAdvFidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L84) `packages/security/src/semantics/fidelity.ts`

```ts
export declare function collectAdvFidelityCoverage(providers?: SecurityAdvTarget[]): AdvFidelityCoverage;
```

#### `completeHandshake`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L70) `packages/security/src/semantics/mtls.ts`

```ts
export declare function completeHandshake(session: MtlsSession, input: HandshakeInput): AxisAdvStep<MtlsState>;
```

#### `correlate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L143) `packages/security/src/semantics/siem-audit.ts`

```ts
export declare function correlate(session: SiemAuditSession, rule: CorrelationRule): AxisAdvStep<SiemAuditState>;
```

#### `createRbacPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L29) `packages/security/src/authorization.ts`

```ts
export declare function createRbacPolicy(roles: RbacRole[]): RbacPolicy;
```

#### `createWafPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L85) `packages/security/src/waf.ts`

```ts
export declare function createWafPolicy(rules?: WafRule[]): WafPolicy;
```

#### `decideAdmission`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L121) `packages/security/src/semantics/container-k8s.ts`

```ts
export declare function decideAdmission(session: K8sSession, request: AdmissionRequest, input: {
    requireLabel: string;
    allowedNamespaces: string[];
}): AxisAdvStep<K8sState>;
```

#### `DEFAULT_LICENSE_POLICY`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L163) `packages/security/src/sbom.ts`

```ts
export declare const DEFAULT_LICENSE_POLICY: LicensePolicy;
```

#### `DEFAULT_SIGNATURES`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L35) `packages/security/src/secrets-scan.ts`

TruffleHog + Gitleaks 由来の代表 signature を SSOT 化。 実 signature 全網羅は upstream に譲り、 kiwa fixture test で よく参照される 8 kind に絞る。

```ts
export declare const DEFAULT_SIGNATURES: SecretSignature[];
```

#### `deriveKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L105) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export declare function deriveKey(session: CryptoSession, input: KdfInput): AxisAdvStep<CryptoState>;
```

#### `detectBoundaryCrossings`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L164) `packages/security/src/threat-model.ts`

```ts
export declare function detectBoundaryCrossings(zones: TrustZone[], flows: DataFlow[], membership: Map<string, string>): BoundaryCrossing[];
```

#### `DistributedRateLimiter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L190) `packages/security/src/rate-limit.ts`

```ts
export declare class DistributedRateLimiter {
    constructor(config: DistributedRateLimitConfig);
    check(clientId: string, nowMs?: number): RateLimitDecision;
}
```

#### `encapsulatePq`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L176) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export declare function encapsulatePq(session: CryptoSession, input: PqKemInput): AxisAdvStep<CryptoState>;
```

#### `enforceCrossOriginIsolation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L128) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export declare function enforceCrossOriginIsolation(session: WvsSession, input: CrossOriginInput): AxisAdvStep<WvsState>;
```

#### `enforceMicroSegment`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L145) `packages/security/src/semantics/zero-trust.ts`

```ts
export declare function enforceMicroSegment(session: ZeroTrustSession, policy: SegmentPolicy): AxisAdvStep<ZeroTrustState>;
```

#### `enforcePodSecurity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L72) `packages/security/src/semantics/container-k8s.ts`

```ts
export declare function enforcePodSecurity(session: K8sSession, level: PodSecurityLevel, pod: PodSpec): AxisAdvStep<K8sState>;
```

#### `enforceTrustedTypes`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L92) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export declare function enforceTrustedTypes(session: WvsSession, input: TrustedTypesInput): AxisAdvStep<WvsState>;
```

#### `escalate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L130) `packages/security/src/semantics/incident-response.ts`

```ts
export declare function escalate(session: IncidentSession, input: EscalationInput): AxisAdvStep<IncidentState>;
```

#### `evaluateAbac`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L119) `packages/security/src/authorization.ts`

```ts
export declare function evaluateAbac(policy: AbacPolicy, attrs: AbacAttributes): AbacDecision;
```

#### `evaluateCombined`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L160) `packages/security/src/authorization.ts`

```ts
export declare function evaluateCombined(input: CombinedPolicyInput): AbacDecision;
```

#### `evaluateLicense`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L169) `packages/security/src/sbom.ts`

```ts
export declare function evaluateLicense(license: string | undefined, policy?: LicensePolicy): LicenseVerdict;
```

#### `evaluatePosture`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L70) `packages/security/src/semantics/zero-trust.ts`

```ts
export declare function evaluatePosture(session: ZeroTrustSession, posture: DevicePosture): AxisAdvStep<ZeroTrustState>;
```

#### `evaluateWaf`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L94) `packages/security/src/waf.ts`

```ts
export declare function evaluateWaf(policy: WafPolicy, request: WafRequest): WafDecision;
```

#### `expandRoles`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L57) `packages/security/src/authorization.ts`

Given a subject, expand its assigned roles through the parent hierarchy and collect the transitive permission set. Used by the RBAC evaluator.

```ts
export declare function expandRoles(policy: RbacPolicy, subject: RbacSubject): Set<string>;
```

#### `isKiwaAdvModeReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L13) `packages/security/src/semantics/real-driver.ts`

```ts
export declare function isKiwaAdvModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### `isKiwaModeReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L60) `packages/security/src/real-driver.ts`

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### `isRotationOverdue`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L156) `packages/security/src/secrets-scan.ts`

```ts
export declare function isRotationOverdue(tracker: RotationTracker, nowMs?: number): boolean;
```

#### `LeakyBucket`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L84) `packages/security/src/rate-limit.ts`

```ts
export declare class LeakyBucket {
    constructor(config: LeakyBucketConfig, nowMs?: number);
    enqueue(count: number, nowMs?: number): RateLimitDecision;
}
```

#### `lookupAdvisories`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L126) `packages/security/src/sbom.ts`

```ts
export declare function lookupAdvisories(doc: SbomDocument, feed: AdvisoryFeed): AdvisoryLookupResult[];
```

#### `markRotated`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L163) `packages/security/src/secrets-scan.ts`

```ts
export declare function markRotated(tracker: RotationTracker, atMs?: number): RotationTracker;
```

#### `matchReproducibleBuild`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L106) `packages/security/src/semantics/supply-chain.ts`

```ts
export declare function matchReproducibleBuild(session: SupplyChainSession, input: ReproducibleInput): AxisAdvStep<SupplyChainState>;
```

#### `OWASP_CRS_DEFAULT`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L46) `packages/security/src/waf.ts`

OWASP CRS の代表 rule id を kiwa が使う shape に写像した既定 rule 集。

```ts
export declare const OWASP_CRS_DEFAULT: WafRule[];
```

#### `pastaCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L68) `packages/security/src/threat-model.ts`

```ts
export declare function pastaCoverage(findings: PastaFinding[]): {
    overallCompleteness: number;
    perStage: Record<PastaStage, number>;
    gaps: PastaStage[];
};
```

#### `providerAdvEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L241) `packages/security/src/semantics/types.ts`

```ts
export declare function providerAdvEventName(target: SecurityAdvTarget, neutral: NeutralAdvEventName): string;
```

#### `rbacAllows`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L75) `packages/security/src/authorization.ts`

```ts
export declare function rbacAllows(policy: RbacPolicy, subject: RbacSubject, permission: string): boolean;
```

#### `REAL_DRIVER_REQUIRED_KEYS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L13) `packages/security/src/real-driver.ts`

```ts
export declare const REAL_DRIVER_REQUIRED_KEYS: Record<SecurityProvider, string[]>;
```

#### `reasonSimilarity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L112) `packages/security/src/fidelity.ts`

```ts
export declare function reasonSimilarity(real: SecurityEvent[], mock: SecurityEvent[]): number;
```

#### `recordPostMortem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L174) `packages/security/src/semantics/incident-response.ts`

```ts
export declare function recordPostMortem(session: IncidentSession, input: PostMortemInput): AxisAdvStep<IncidentState>;
```

#### `requestJit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L117) `packages/security/src/semantics/zero-trust.ts`

```ts
export declare function requestJit(session: ZeroTrustSession, request: JitRequest): AxisAdvStep<ZeroTrustState>;
```

#### `resolveAdvApiKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L85) `packages/security/src/semantics/real-driver.ts`

```ts
export declare function resolveAdvApiKey(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): string | null;
```

#### `resolveAdvEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L76) `packages/security/src/semantics/real-driver.ts`

```ts
export declare function resolveAdvEndpoint(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): string | null;
```

#### `resolveAdvRealDriver`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L49) `packages/security/src/semantics/real-driver.ts`

```ts
export declare function resolveAdvRealDriver(input: AdvRealDriverGateInput): AdvRealDriverGateResult;
```

#### `resolveClientId`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L236) `packages/security/src/rate-limit.ts`

```ts
export declare function resolveClientId(input: {
    kind: ClientIdKind;
    ip?: string;
    userId?: string;
    apiKey?: string;
}): string;
```

#### `resolveEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L89) `packages/security/src/real-driver.ts`

provider 別の endpoint / api key を env から解決する。 testcontainers container の host / port 情報を渡す想定。

```ts
export declare function resolveEndpoint(provider: SecurityProvider, env?: NodeJS.ProcessEnv): RealDriverEndpoint;
```

#### `resolveRealtimeDriver`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L35) `packages/security/src/real-driver.ts`

env の状態から real driver を使うかどうか判定する。 KIWA_MODE=real + provider 別必須 env が揃った時のみ true。

```ts
export declare function resolveRealtimeDriver(input: RealDriverGateInput): RealDriverGateResult;
```

#### `rotateKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L139) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export declare function rotateKey(session: CryptoSession, input: KeyRotationInput): AxisAdvStep<CryptoState>;
```

#### `runSecurityFidelityCheck`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L55) `packages/security/src/fidelity.ts`

```ts
export declare function runSecurityFidelityCheck(input: SecurityFidelityInput): Promise<SecurityFidelityReport>;
```

#### `scanSecrets`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L111) `packages/security/src/secrets-scan.ts`

```ts
export declare function scanSecrets(source: string, signatures?: SecretSignature[]): SecretFinding[];
```

#### `scoreDread`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L116) `packages/security/src/threat-model.ts`

```ts
export declare function scoreDread(input: DreadInput): DreadResult;
```

#### `scoreRisk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L89) `packages/security/src/semantics/zero-trust.ts`

```ts
export declare function scoreRisk(session: ZeroTrustSession, input: {
    unusualLocation: boolean;
    unusualTime: boolean;
    newDevice: boolean;
    threatIntelHit: boolean;
}): AxisAdvStep<ZeroTrustState>;
```

#### `scoreStride`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L29) `packages/security/src/threat-model.ts`

```ts
export declare function scoreStride(threats: StrideThreat[]): {
    total: number;
    byCategory: Record<StrideCategory, number>;
    highest: StrideThreat | null;
};
```

#### `sealAead`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L89) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export declare function sealAead(session: CryptoSession, input: AeadInput): AxisAdvStep<CryptoState>;
```

#### `sealEvents`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L101) `packages/security/src/semantics/siem-audit.ts`

```ts
export declare function sealEvents(session: SiemAuditSession, input: {
    previousHash: string;
}): AxisAdvStep<SiemAuditState>;
```

#### `SECURITY_ADV_AXIS_TO_EVENTS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L30) `packages/security/src/semantics/fidelity.ts`

```ts
export declare const SECURITY_ADV_AXIS_TO_EVENTS: Record<SecurityAdvAxis, NeutralAdvEventName[]>;
```

#### `SECURITY_ADV_FIDELITY_GRID`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L100) `packages/security/src/semantics/fidelity.ts`

provider × axis = 4 × 8 = 32 grid の SSOT 列挙。

```ts
export declare const SECURITY_ADV_FIDELITY_GRID: Array<{
    provider: SecurityAdvTarget;
    axis: SecurityAdvAxis;
}>;
```

#### `SECURITY_FIDELITY_GRID`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L164) `packages/security/src/fidelity.ts`

32 grid の全 combination を SSOT で列挙 — provider x axis の どの組合せが fidelity harness の一次対象か明示する。

```ts
export declare const SECURITY_FIDELITY_GRID: {
    provider: SecurityProvider;
    axis: SecurityAxis;
}[];
```

#### `shannonEntropy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L96) `packages/security/src/secrets-scan.ts`

Shannon entropy of a string over its own byte histogram. Values &gt;= 3.5 are typical for random secrets over base64/hex alphabets; anything closer to natural language sits well below.

```ts
export declare function shannonEntropy(input: string): number;
```

#### `signProvenance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L126) `packages/security/src/semantics/supply-chain.ts`

```ts
export declare function signProvenance(session: SupplyChainSession, input: ProvenanceInput): AxisAdvStep<SupplyChainState>;
```

#### `signWithHsm`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L158) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export declare function signWithHsm(session: CryptoSession, input: HsmSignInput): AxisAdvStep<CryptoState>;
```

#### `skipUnlessAdvReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L113) `packages/security/src/semantics/real-driver.ts`

```ts
export declare function skipUnlessAdvReal(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

#### `skipUnlessReal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L68) `packages/security/src/real-driver.ts`

vitest 用 skip helper — describe block を real driver 未該当時に skip する経路の SSOT。 return.skip=true なら describe.skip 相当。

```ts
export declare function skipUnlessReal(provider: SecurityProvider, env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

#### `SlidingWindow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L140) `packages/security/src/rate-limit.ts`

```ts
export declare class SlidingWindow {
    constructor(config: SlidingWindowConfig);
    record(nowMs?: number): RateLimitDecision;
}
```

#### `startCryptoSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L73) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export declare function startCryptoSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): CryptoSession;
```

#### `startIncidentSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L66) `packages/security/src/semantics/incident-response.ts`

```ts
export declare function startIncidentSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): IncidentSession;
```

#### `startK8sSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L56) `packages/security/src/semantics/container-k8s.ts`

```ts
export declare function startK8sSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): K8sSession;
```

#### `startMtlsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L54) `packages/security/src/semantics/mtls.ts`

```ts
export declare function startMtlsSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): MtlsSession;
```

#### `startSiemAuditSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L58) `packages/security/src/semantics/siem-audit.ts`

```ts
export declare function startSiemAuditSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): SiemAuditSession;
```

#### `startSupplyChainSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L62) `packages/security/src/semantics/supply-chain.ts`

```ts
export declare function startSupplyChainSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): SupplyChainSession;
```

#### `startWvsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L57) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export declare function startWvsSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): WvsSession;
```

#### `startZeroTrustSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L53) `packages/security/src/semantics/zero-trust.ts`

```ts
export declare function startZeroTrustSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): ZeroTrustSession;
```

#### `structureEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L75) `packages/security/src/semantics/siem-audit.ts`

```ts
export declare function structureEvent(session: SiemAuditSession, raw: SiemEvent): {
    step: AxisAdvStep<SiemAuditState>;
    event: StructuredEvent;
};
```

#### `suppressFalsePositive`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L122) `packages/security/src/waf.ts`

False positive suppression — allow-list per path で特定 rule を除外する partial policy override。 使い方は既存 policy + 部分 rule の rebuild。

```ts
export declare function suppressFalsePositive(policy: WafPolicy, ruleId: string, exceptionPath: string): WafPolicy;
```

#### `toAuthorizationEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L176) `packages/security/src/authorization.ts`

```ts
export declare function toAuthorizationEvent(input: {
    provider: 'casbin' | 'coraza';
    decision: AbacDecision;
    subject: string;
    action: string;
    timestamp: number;
}): SecurityEvent;
```

#### `toCspEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L209) `packages/security/src/csp.ts`

CSP violation を統一 event 形式に変換する adapter。 fidelity harness が real (Report-To API) と mock (unit test) の 両方の event 列を同型で扱えるようにする。

```ts
export declare function toCspEvent(input: {
    provider: 'helmet' | 'coraza';
    verdict: 'allow' | 'deny' | 'warn';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### `toCycloneDx`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L30) `packages/security/src/sbom.ts`

CycloneDX 1.5 minimal — components が bomFormat = "CycloneDX"、 specVersion = "1.5"。

```ts
export declare function toCycloneDx(components: SbomComponent[], nowIso?: string): SbomDocument;
```

#### `TokenBucket`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L30) `packages/security/src/rate-limit.ts`

```ts
export declare class TokenBucket {
    constructor(config: TokenBucketConfig, nowMs?: number);
    consume(count: number, nowMs?: number): RateLimitDecision;
}
```

#### `toRateLimitEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L255) `packages/security/src/rate-limit.ts`

```ts
export declare function toRateLimitEvent(input: {
    provider: 'express-rate-limit' | 'coraza';
    decision: RateLimitDecision;
    clientId: string;
    strategy: RateLimitStrategy | 'distributed';
    timestamp: number;
}): SecurityEvent;
```

#### `toSbomEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L186) `packages/security/src/sbom.ts`

```ts
export declare function toSbomEvent(input: {
    provider: 'helmet' | 'coraza';
    verdict: 'allow' | 'deny' | 'warn';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### `toSecretsEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L167) `packages/security/src/secrets-scan.ts`

```ts
export declare function toSecretsEvent(input: {
    provider: 'helmet' | 'coraza';
    finding: SecretFinding;
    timestamp: number;
}): SecurityEvent;
```

#### `toSecurityHeadersEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L181) `packages/security/src/security-headers.ts`

```ts
export declare function toSecurityHeadersEvent(input: {
    provider: 'helmet';
    verdict: 'allow' | 'warn' | 'deny';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### `toSpdx`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L40) `packages/security/src/sbom.ts`

SPDX 2.3 minimal — packages list + relationships (DESCRIBES / DEPENDS_ON)。

```ts
export declare function toSpdx(components: SbomComponent[], nowIso?: string): SbomDocument;
```

#### `toThreatModelEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L201) `packages/security/src/threat-model.ts`

```ts
export declare function toThreatModelEvent(input: {
    provider: 'coraza' | 'helmet';
    verdict: 'allow' | 'deny' | 'warn';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### `toWafEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L137) `packages/security/src/waf.ts`

```ts
export declare function toWafEvent(input: {
    provider: 'coraza' | 'helmet';
    decision: WafDecision;
    request: WafRequest;
    timestamp: number;
}): SecurityEvent;
```

#### `triggerPlaybook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L84) `packages/security/src/semantics/incident-response.ts`

```ts
export declare function triggerPlaybook(session: IncidentSession, input: PlaybookInput): AxisAdvStep<IncidentState>;
```

#### `validateNonce`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L194) `packages/security/src/csp.ts`

nonce 検証 — 同 header 内で同じ nonce が 2 回以上出ないか、 32 char 以上か。

```ts
export declare function validateNonce(nonce: string): {
    ok: boolean;
    reason: string;
};
```

#### `validateSbom`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L50) `packages/security/src/sbom.ts`

SBOM validation — mandatory fields + purl syntax check。

```ts
export declare function validateSbom(doc: SbomDocument): {
    ok: boolean;
    errors: string[];
};
```

#### `validateSecurityHeaders`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L153) `packages/security/src/security-headers.ts`

Header header 値の syntactic validation。 実 browser 実装との fidelity は fidelity harness 側で確認、 ここでは build 段階の misuse だけ検知。

```ts
export declare function validateSecurityHeaders(input: SecurityHeadersInput): {
    ok: boolean;
    errors: string[];
};
```

#### `verdictSimilarity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L102) `packages/security/src/fidelity.ts`

```ts
export declare function verdictSimilarity(real: SecurityEvent[], mock: SecurityEvent[]): number;
```

#### `verifyAttestation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L147) `packages/security/src/semantics/supply-chain.ts`

```ts
export declare function verifyAttestation(session: SupplyChainSession, input: AttestationInput): AxisAdvStep<SupplyChainState>;
```

#### `verifyOcsp`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L111) `packages/security/src/semantics/mtls.ts`

```ts
export declare function verifyOcsp(session: MtlsSession, input: OcspInput): AxisAdvStep<MtlsState>;
```

#### `verifyPin`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L88) `packages/security/src/semantics/mtls.ts`

```ts
export declare function verifyPin(session: MtlsSession, input: PinInput): AxisAdvStep<MtlsState>;
```

#### `verifySlsaLevel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L78) `packages/security/src/semantics/supply-chain.ts`

```ts
export declare function verifySlsaLevel(session: SupplyChainSession, input: SlsaLevelInput): AxisAdvStep<SupplyChainState>;
```

#### `verifySri`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L72) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export declare function verifySri(session: WvsSession, input: SriInput): AxisAdvStep<WvsState>;
```

#### `versionInRange`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L85) `packages/security/src/sbom.ts`

Simple semver "in range" check — accepts `&gt;= a.b.c`, `&lt; a.b.c`, `&lt; a.b.c || &gt;= x.y.z`, or an exact version string. Full semver range algebra is out of scope for the mock (real driver = actual OSV client)。

```ts
export declare function versionInRange(version: string, range: string): boolean;
```

#### `wrapEnvelope`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L124) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export declare function wrapEnvelope(session: CryptoSession, input: EnvelopeInput): AxisAdvStep<CryptoState>;
```

### 型

#### `AbacAttributes`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L84) `packages/security/src/authorization.ts`

ABAC — subject / resource / action / environment 4 属性 + expression evaluator。

```ts
export interface AbacAttributes {
    subject: Record<string, unknown>;
    resource: Record<string, unknown>;
    action: string;
    environment: Record<string, unknown>;
}
```

#### `AbacCombiningAlgo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L106) `packages/security/src/authorization.ts`

Rule combining algorithms follow XACML naming: - deny-overrides: any DENY wins - permit-overrides: any PERMIT wins - first-applicable: return the first rule that matches (default deny after)

```ts
export type AbacCombiningAlgo = 'deny-overrides' | 'permit-overrides' | 'first-applicable';
```

#### `AbacDecision`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L113) `packages/security/src/authorization.ts`

```ts
export interface AbacDecision {
    effect: AbacRuleEffect;
    matchedRule: string | null;
    reason: string;
}
```

#### `AbacPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L108) `packages/security/src/authorization.ts`

```ts
export interface AbacPolicy {
    rules: AbacRule[];
    algorithm: AbacCombiningAlgo;
}
```

#### `AbacRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L93) `packages/security/src/authorization.ts`

```ts
export interface AbacRule {
    id: string;
    effect: AbacRuleEffect;
    /** Predicate against the 4 attribute buckets. */
    condition: (attrs: AbacAttributes) => boolean;
}
```

#### `AbacRuleEffect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L91) `packages/security/src/authorization.ts`

```ts
export type AbacRuleEffect = 'permit' | 'deny';
```

#### `AdmissionRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L49) `packages/security/src/semantics/container-k8s.ts`

```ts
export interface AdmissionRequest {
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: 'Pod' | 'Deployment' | 'Service' | 'ConfigMap';
    namespace: string;
    labels: Record<string, string>;
}
```

#### `AdvFidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L24) `packages/security/src/semantics/fidelity.ts`

```ts
export interface AdvFidelityCoverage {
    providers: SecurityAdvTarget[];
    axes: SecurityAdvAxis[];
    rows: AdvFidelityRow[];
}
```

#### `AdvFidelityRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L17) `packages/security/src/semantics/fidelity.ts`

4 provider × 8 axis = 32 combination advanced fidelity grid (v0.2)。 v0.1 の `SECURITY_FIDELITY_GRID` は provider {helmet / express-rate-limit / casbin / coraza} × 基礎 8 axis を扱う。 本 v0.2 grid は provider {istio / opa / siem-splunk / vault} × 高度 8 axis を扱い、 `SECURITY_FIDELITY_GRID` と直交する 2 段目の grid 構造。

```ts
export interface AdvFidelityRow {
    provider: SecurityAdvTarget;
    axis: SecurityAdvAxis;
    neutralEvents: NeutralAdvEventName[];
    providerEvents: string[];
}
```

#### `Advisory`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L63) `packages/security/src/sbom.ts`

OSV / NVD advisory shape 。 kiwa の in-memory advisory feed で使用。

```ts
export interface Advisory {
    id: string;
    affects: {
        purl: string;
        versionRange: string;
    }[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    source: 'osv' | 'nvd';
}
```

#### `AdvisoryFeed`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L71) `packages/security/src/sbom.ts`

```ts
export interface AdvisoryFeed {
    advisories: Advisory[];
}
```

#### `AdvisoryLookupResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L75) `packages/security/src/sbom.ts`

```ts
export interface AdvisoryLookupResult {
    component: SbomComponent;
    advisories: Advisory[];
}
```

#### `AdvRealDriverConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L94) `packages/security/src/semantics/real-driver.ts`

```ts
export interface AdvRealDriverConfig {
    provider: SecurityAdvTarget;
    endpoint: string | null;
    apiKey: string | null;
    timeoutMs: number;
}
```

#### `AdvRealDriverGateInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L38) `packages/security/src/semantics/real-driver.ts`

```ts
export interface AdvRealDriverGateInput {
    provider: SecurityAdvTarget;
    env?: NodeJS.ProcessEnv;
}
```

#### `AdvRealDriverGateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L43) `packages/security/src/semantics/real-driver.ts`

```ts
export interface AdvRealDriverGateResult {
    useRealDriver: boolean;
    missingKeys: string[];
    reason: string;
}
```

#### `AeadAlgo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L16) `packages/security/src/semantics/crypto-advanced.ts`

Cryptography advanced axis — AEAD + KDF + envelope encryption + key rotation + HSM signing + post-quantum KEM state machine。 Deterministic mock で 6 signal 系統を提供。 real driver 経路では Vault transit engine や AWS KMS / GCP KMS に対して encryption を発火する。

```ts
export type AeadAlgo = 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'AES-256-GCM-SIV';
```

#### `AeadInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L37) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export interface AeadInput {
    algo: AeadAlgo;
    plaintextLen: number;
    aadLen: number;
}
```

#### `AttestationInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L56) `packages/security/src/semantics/supply-chain.ts`

```ts
export interface AttestationInput {
    attestationType: 'slsa-provenance' | 'spdx-sbom' | 'cyclone-dx-vex';
    trustRootFingerprint: string;
    validSignatures: number;
}
```

#### `AxisAdvStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L82) `packages/security/src/semantics/types.ts`

```ts
export interface AxisAdvStep<TState extends string> {
    neutralEvent: NeutralAdvEventName;
    providerEvent: string;
    state: TState;
    timestampMs: number;
    metadata: Record<string, string | number | boolean>;
}
```

#### `BoundaryCrossing`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L156) `packages/security/src/threat-model.ts`

```ts
export interface BoundaryCrossing {
    flow: DataFlow;
    fromZone: TrustZone;
    toZone: TrustZone;
    requiredMitigations: string[];
    missingMitigations: string[];
}
```

#### `ClientIdKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L234) `packages/security/src/rate-limit.ts`

Client identity keyspace resolver — IP / user / API-key の 3 通り。

```ts
export type ClientIdKind = 'ip' | 'user' | 'api-key';
```

#### `CombinedPolicyInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L155) `packages/security/src/authorization.ts`

Combined policy engine — RBAC decision と ABAC decision を組合せる。 RBAC PERMIT + ABAC PERMIT → PERMIT、 いずれか DENY → DENY、 RBAC 未定義 permission は ABAC のみで判定。

```ts
export interface CombinedPolicyInput {
    rbac?: {
        policy: RbacPolicy;
        subject: RbacSubject;
        permission: string;
    };
    abac?: {
        policy: AbacPolicy;
        attrs: AbacAttributes;
    };
}
```

#### `CorrelationRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L52) `packages/security/src/semantics/siem-audit.ts`

```ts
export interface CorrelationRule {
    ruleId: string;
    requiredEventIds: string[];
    windowMs: number;
}
```

#### `CrossOriginInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L51) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export interface CrossOriginInput {
    coop: 'unsafe-none' | 'same-origin' | 'same-origin-allow-popups';
    coep: 'unsafe-none' | 'require-corp' | 'credentialless';
    corp: 'same-site' | 'same-origin' | 'cross-origin';
}
```

#### `CryptoSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L29) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export interface CryptoSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: CryptoState;
    history: AxisAdvStep<CryptoState>[];
    currentKeyId: string | null;
}
```

#### `CryptoState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L20) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export type CryptoState = 'idle' | 'aead-sealed' | 'kdf-derived' | 'envelope-wrapped' | 'key-rotated' | 'hsm-signed' | 'pq-encapsulated';
```

#### `CspDirective`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L18) `packages/security/src/csp.ts`

CSP directive の完全列挙 (Fetch directive + Document directive + Reporting)。

```ts
export type CspDirective = 'default-src' | 'script-src' | 'script-src-elem' | 'script-src-attr' | 'style-src' | 'style-src-elem' | 'style-src-attr' | 'img-src' | 'connect-src' | 'font-src' | 'frame-src' | 'frame-ancestors' | 'form-action' | 'base-uri' | 'object-src' | 'worker-src' | 'child-src' | 'media-src' | 'manifest-src' | 'trusted-types' | 'require-trusted-types-for' | 'upgrade-insecure-requests' | 'block-all-mixed-content' | 'report-uri' | 'report-to';
```

#### `CspHashAlgo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L52) `packages/security/src/csp.ts`

```ts
export type CspHashAlgo = 'sha256' | 'sha384' | 'sha512';
```

#### `CspHashOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L54) `packages/security/src/csp.ts`

```ts
export interface CspHashOptions {
    algorithm: CspHashAlgo;
    /** Base64-encoded digest。 */
    digest: string;
    /** attach directive (default script-src)。 */
    directives?: CspDirective[];
}
```

#### `CspHeaderOutput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L82) `packages/security/src/csp.ts`

```ts
export interface CspHeaderOutput {
    headerName: 'Content-Security-Policy' | 'Content-Security-Policy-Report-Only';
    headerValue: string;
    /** 各 directive を key に持つ debug 用の展開後 map。 */
    expandedDirectives: Record<CspDirective, string[]>;
}
```

#### `CspNonceOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L45) `packages/security/src/csp.ts`

```ts
export interface CspNonceOptions {
    /** Base64URL-encoded random nonce (16-32 bytes)。 */
    nonce: string;
    /** attach directive (default script-src)。 */
    directives?: CspDirective[];
}
```

#### `CspPolicyInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L62) `packages/security/src/csp.ts`

```ts
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
```

#### `CtLogInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L49) `packages/security/src/semantics/mtls.ts`

```ts
export interface CtLogInput {
    sctCount: number;
    minSctRequired: number;
}
```

#### `DataFlow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L148) `packages/security/src/threat-model.ts`

```ts
export interface DataFlow {
    id: string;
    from: string;
    to: string;
    data: string;
    mitigations: string[];
}
```

#### `DevicePosture`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L34) `packages/security/src/semantics/zero-trust.ts`

```ts
export interface DevicePosture {
    osUpToDate: boolean;
    diskEncrypted: boolean;
    edrRunning: boolean;
    mdmEnrolled: boolean;
}
```

#### `DistributedRateLimitConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L184) `packages/security/src/rate-limit.ts`

Distributed keyspace mock — Redis-backed のような multi-node coordination を hash-shard で emulate する。 node 数 = shards、 各 shard は独立 counter。

```ts
export interface DistributedRateLimitConfig {
    shards: number;
    perShardMaxRequests: number;
    windowMs: number;
}
```

#### `DreadInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L102) `packages/security/src/threat-model.ts`

DREAD scoring — each factor 1-10、 total = sum、 threshold = 30 (mitigation must-do)。 一般的な 5 factor 平均 6 以上 = critical。

```ts
export interface DreadInput {
    damage: number;
    reproducibility: number;
    exploitability: number;
    affectedUsers: number;
    discoverability: number;
}
```

#### `DreadResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L110) `packages/security/src/threat-model.ts`

```ts
export interface DreadResult {
    total: number;
    average: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
```

#### `EnvelopeInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L50) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export interface EnvelopeInput {
    cek: string;
    kek: string;
    masterKeyProvider: 'kms' | 'vault' | 'hsm';
}
```

#### `EscalationInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L48) `packages/security/src/semantics/incident-response.ts`

```ts
export interface EscalationInput {
    channels: string[];
    onCallPrimary: string;
    onCallSecondary: string | null;
}
```

#### `ForensicsInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L54) `packages/security/src/semantics/incident-response.ts`

```ts
export interface ForensicsInput {
    memoryDumpMb: number;
    networkPcapMb: number;
    diskImageGb: number;
}
```

#### `HandshakeInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L33) `packages/security/src/semantics/mtls.ts`

```ts
export interface HandshakeInput {
    peerCn: string;
    cipherSuite: string;
    tlsVersion: '1.2' | '1.3';
}
```

#### `HsmSignInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L62) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export interface HsmSignInput {
    keyId: string;
    digest: string;
    algorithm: 'ECDSA-P256' | 'RSA-PSS-2048' | 'Ed25519';
}
```

#### `HstsOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L14) `packages/security/src/security-headers.ts`

```ts
export interface HstsOptions {
    maxAgeSec: number;
    includeSubDomains?: boolean;
    preload?: boolean;
}
```

#### `IncidentSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L26) `packages/security/src/semantics/incident-response.ts`

```ts
export interface IncidentSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: IncidentState;
    history: AxisAdvStep<IncidentState>[];
    playbookId: string | null;
    severity: IncidentSeverity | null;
    forensicsArtifacts: string[];
}
```

#### `IncidentSeverity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L16) `packages/security/src/semantics/incident-response.ts`

Incident response axis — playbook trigger + severity classification + escalation + forensics capture + post-mortem recording state machine。 Deterministic mock で 5 signal 系統を提供。 real driver 経路では PagerDuty / Splunk Phantom SOAR platform への escalation を発火する。

```ts
export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'sev5';
```

#### `IncidentState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L18) `packages/security/src/semantics/incident-response.ts`

```ts
export type IncidentState = 'idle' | 'playbook-triggered' | 'severity-classified' | 'escalated' | 'forensics-captured' | 'post-mortem-recorded';
```

#### `JitRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L41) `packages/security/src/semantics/zero-trust.ts`

```ts
export interface JitRequest {
    requestedRole: string;
    justification: string;
    ttlSeconds: number;
}
```

#### `K8sSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L25) `packages/security/src/semantics/container-k8s.ts`

```ts
export interface K8sSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: K8sState;
    history: AxisAdvStep<K8sState>[];
    enforcedLevel: PodSecurityLevel | null;
}
```

#### `K8sState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L19) `packages/security/src/semantics/container-k8s.ts`

```ts
export type K8sState = 'idle' | 'pod-security-enforced' | 'network-policy-applied' | 'admission-decided';
```

#### `KdfAlgo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L17) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export type KdfAlgo = 'HKDF-SHA256' | 'HKDF-SHA512' | 'PBKDF2' | 'Argon2id' | 'scrypt';
```

#### `KdfInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L43) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export interface KdfInput {
    algo: KdfAlgo;
    saltLen: number;
    info: string;
    iterations: number;
}
```

#### `KeyRotationInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L56) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export interface KeyRotationInput {
    oldKeyId: string;
    newKeyId: string;
    reason: 'scheduled' | 'compromised' | 'policy';
}
```

#### `LeakyBucketConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L78) `packages/security/src/rate-limit.ts`

Leaky bucket — queue-based、 steady-state throughput 保証。

```ts
export interface LeakyBucketConfig {
    capacity: number;
    /** queue drain rate (items per ms、 float 可)。 */
    drainPerMs: number;
}
```

#### `LicensePolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L157) `packages/security/src/sbom.ts`

```ts
export interface LicensePolicy {
    allow: string[];
    warn: string[];
    deny: string[];
}
```

#### `LicenseVerdict`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L155) `packages/security/src/sbom.ts`

License policy — SPDX license id ごとに allow / warn / deny 判定。

```ts
export type LicenseVerdict = 'allow' | 'warn' | 'deny';
```

#### `MtlsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L25) `packages/security/src/semantics/mtls.ts`

```ts
export interface MtlsSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: MtlsState;
    history: AxisAdvStep<MtlsState>[];
    pinnedFingerprints: string[];
}
```

#### `MtlsState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L17) `packages/security/src/semantics/mtls.ts`

mTLS + certificate pinning axis — mutual TLS handshake + pin verification + OCSP stapling + Certificate Transparency log check state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では実 istio / envoy sidecar に対して TLS handshake を張り、 SPKI pin と OCSP staple を 検証する。

```ts
export type MtlsState = 'idle' | 'handshake-completed' | 'pinned' | 'ocsp-verified' | 'ct-verified' | 'failed';
```

#### `NetworkPolicySpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L42) `packages/security/src/semantics/container-k8s.ts`

```ts
export interface NetworkPolicySpec {
    namespace: string;
    podSelector: Record<string, string>;
    ingressFromNamespaces: string[];
    egressToNamespaces: string[];
}
```

#### `NeutralAdvEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L37) `packages/security/src/semantics/types.ts`

```ts
export type NeutralAdvEventName = 'mtls.handshake_completed' | 'mtls.cert_pinned' | 'mtls.ocsp_verified' | 'mtls.ct_log_checked' | 'zt.device_posture_evaluated' | 'zt.risk_scored' | 'zt.jit_granted' | 'zt.micro_segment_enforced' | 'siem.event_structured' | 'siem.tamper_evident_sealed' | 'siem.retention_applied' | 'siem.correlation_matched' | 'ir.playbook_triggered' | 'ir.severity_classified' | 'ir.escalation_sent' | 'ir.forensics_captured' | 'ir.post_mortem_recorded' | 'crypto.aead_sealed' | 'crypto.kdf_derived' | 'crypto.envelope_wrapped' | 'crypto.key_rotated' | 'crypto.hsm_signed' | 'crypto.pq_kem_encapsulated' | 'k8s.pod_security_enforced' | 'k8s.network_policy_applied' | 'k8s.admission_denied' | 'k8s.admission_allowed' | 'sc.slsa_level_verified' | 'sc.reproducible_build_matched' | 'sc.provenance_signed' | 'sc.attestation_verified' | 'wvs.sri_hash_verified' | 'wvs.trusted_types_enforced' | 'wvs.permissions_policy_applied' | 'wvs.cross_origin_isolated';
```

#### `OcspInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L44) `packages/security/src/semantics/mtls.ts`

```ts
export interface OcspInput {
    stapled: boolean;
    goodResponse: boolean;
}
```

#### `PastaFinding`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L61) `packages/security/src/threat-model.ts`

```ts
export interface PastaFinding {
    stage: PastaStage;
    summary: string;
    /** stage 単位 completeness 0-1 (test coverage proxy)。 */
    completeness: number;
}
```

#### `PastaStage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L52) `packages/security/src/threat-model.ts`

PASTA stage identifiers — 7 stage は Tony UcedaVélez / Marco Morana 定義に沿う。

```ts
export type PastaStage = 'define-objectives' | 'define-technical-scope' | 'application-decomposition' | 'threat-analysis' | 'vulnerability-analysis' | 'attack-modeling' | 'risk-analysis';
```

#### `PermissionsFeature`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L36) `packages/security/src/security-headers.ts`

Permissions-Policy feature 名 — Chrome/Firefox で実装されている代表 feature。

```ts
export type PermissionsFeature = 'accelerometer' | 'ambient-light-sensor' | 'autoplay' | 'battery' | 'camera' | 'display-capture' | 'document-domain' | 'encrypted-media' | 'execution-while-not-rendered' | 'execution-while-out-of-viewport' | 'fullscreen' | 'geolocation' | 'gyroscope' | 'magnetometer' | 'microphone' | 'midi' | 'payment' | 'picture-in-picture' | 'publickey-credentials-get' | 'screen-wake-lock' | 'sync-xhr' | 'usb' | 'web-share' | 'xr-spatial-tracking';
```

#### `PermissionsPolicyInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L44) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export interface PermissionsPolicyInput {
    features: Array<{
        name: 'camera' | 'microphone' | 'geolocation' | 'payment' | 'usb' | 'gyroscope';
        allowlist: 'none' | 'self' | 'src' | string;
    }>;
}
```

#### `PermissionsSource`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L63) `packages/security/src/security-headers.ts`

allowlist source per feature — `*`, `self`, or explicit origin list.

```ts
export type PermissionsSource = '*' | 'self' | 'none' | {
    origins: string[];
};
```

#### `PinInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L39) `packages/security/src/semantics/mtls.ts`

```ts
export interface PinInput {
    spkiSha256: string;
    expectedPins: string[];
}
```

#### `PlaybookInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L36) `packages/security/src/semantics/incident-response.ts`

```ts
export interface PlaybookInput {
    playbookId: string;
    detectionSource: string;
    initialAlert: string;
}
```

#### `PodSecurityLevel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L17) `packages/security/src/semantics/container-k8s.ts`

Container / Kubernetes security axis — Pod Security Standard enforcement + NetworkPolicy application + Admission Controller (Gatekeeper / Kyverno) decision state machine。 Deterministic mock で 3 signal 系統 + 2 admission verdict を提供。 real driver 経路では OPA Gatekeeper に対して webhook を発火する。

```ts
export type PodSecurityLevel = 'privileged' | 'baseline' | 'restricted';
```

#### `PodSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L33) `packages/security/src/semantics/container-k8s.ts`

```ts
export interface PodSpec {
    namespace: string;
    runAsRoot: boolean;
    privileged: boolean;
    allowPrivilegeEscalation: boolean;
    hostNetwork: boolean;
    hostPid: boolean;
}
```

#### `PostMortemInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L60) `packages/security/src/semantics/incident-response.ts`

```ts
export interface PostMortemInput {
    rootCause: string;
    contributingFactors: string[];
    actionItems: string[];
}
```

#### `PqKemAlgo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L18) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export type PqKemAlgo = 'ML-KEM-768' | 'ML-KEM-1024' | 'Kyber768';
```

#### `PqKemInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L68) `packages/security/src/semantics/crypto-advanced.ts`

```ts
export interface PqKemInput {
    algo: PqKemAlgo;
    publicKeyLen: number;
}
```

#### `ProvenanceInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L50) `packages/security/src/semantics/supply-chain.ts`

```ts
export interface ProvenanceInput {
    builderId: string;
    materialsCount: number;
    signatureAlgorithm: 'sigstore-cosign' | 'in-toto' | 'gpg';
}
```

#### `RateLimitDecision`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L16) `packages/security/src/rate-limit.ts`

```ts
export interface RateLimitDecision {
    allowed: boolean;
    remaining: number;
    resetAtMs: number;
    reason: string;
}
```

#### `RateLimitStrategy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L14) `packages/security/src/rate-limit.ts`

```ts
export type RateLimitStrategy = 'token-bucket' | 'leaky-bucket' | 'sliding-window';
```

#### `RbacPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L25) `packages/security/src/authorization.ts`

```ts
export interface RbacPolicy {
    roles: Map<string, RbacRole>;
}
```

#### `RbacRole`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L13) `packages/security/src/authorization.ts`

```ts
export interface RbacRole {
    name: string;
    permissions: string[];
    /** parent roles — permissions を継承する上位 role 名。 */
    parents?: string[];
}
```

#### `RbacSubject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L20) `packages/security/src/authorization.ts`

```ts
export interface RbacSubject {
    id: string;
    roles: string[];
}
```

#### `RealDriverEndpoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L79) `packages/security/src/real-driver.ts`

```ts
export interface RealDriverEndpoint {
    provider: SecurityProvider;
    endpoint: string | null;
    apiKey: string | null;
}
```

#### `RealDriverGateInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L20) `packages/security/src/real-driver.ts`

```ts
export interface RealDriverGateInput {
    provider: SecurityProvider;
    env?: NodeJS.ProcessEnv;
}
```

#### `RealDriverGateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L25) `packages/security/src/real-driver.ts`

```ts
export interface RealDriverGateResult {
    useRealDriver: boolean;
    missingKeys: string[];
    reason: string;
}
```

#### `ReferrerPolicyValue`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L25) `packages/security/src/security-headers.ts`

```ts
export type ReferrerPolicyValue = 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
```

#### `ReproducibleInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L44) `packages/security/src/semantics/supply-chain.ts`

```ts
export interface ReproducibleInput {
    buildA_hash: string;
    buildB_hash: string;
    toolchainVersion: string;
}
```

#### `RetentionPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L45) `packages/security/src/semantics/siem-audit.ts`

```ts
export interface RetentionPolicy {
    hotDays: number;
    warmDays: number;
    coldDays: number;
    legalHold: boolean;
}
```

#### `RotationPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L142) `packages/security/src/secrets-scan.ts`

Rotation policy — secret 発見時の rotation SLA + tracking。

```ts
export interface RotationPolicy {
    /** 発見から X 日以内に rotation 必須。 */
    rotateWithinDays: number;
    /** 対象 kind (未指定 = 全 kind)。 */
    appliesTo?: SecretKind[];
}
```

#### `RotationTracker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L149) `packages/security/src/secrets-scan.ts`

```ts
export interface RotationTracker {
    finding: SecretFinding;
    discoveredAtMs: number;
    rotatedAtMs: number | null;
    policy: RotationPolicy;
}
```

#### `SbomComponent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L13) `packages/security/src/sbom.ts`

```ts
export interface SbomComponent {
    name: string;
    version: string;
    /** Package URL — e.g., pkg:npm/foo@1.2.3。 */
    purl: string;
    /** SPDX license expression (e.g., MIT, Apache-2.0, "MIT OR Apache-2.0")。 */
    license?: string;
}
```

#### `SbomDocument`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L22) `packages/security/src/sbom.ts`

```ts
export interface SbomDocument {
    format: 'cyclonedx' | 'spdx';
    formatVersion: string;
    components: SbomComponent[];
    generatedAtIso: string;
}
```

#### `SecretFinding`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L82) `packages/security/src/secrets-scan.ts`

```ts
export interface SecretFinding {
    kind: SecretKind;
    matched: string;
    line: number;
    column: number;
    entropy: number;
    ruleDescription: string;
}
```

#### `SecretKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L13) `packages/security/src/secrets-scan.ts`

```ts
export type SecretKind = 'aws-access-key' | 'aws-secret-key' | 'github-token' | 'slack-token' | 'openai-key' | 'stripe-key' | 'generic-jwt' | 'generic-private-key';
```

#### `SecretSignature`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L23) `packages/security/src/secrets-scan.ts`

```ts
export interface SecretSignature {
    kind: SecretKind;
    pattern: RegExp;
    minEntropy?: number;
    description: string;
}
```

#### `SecurityAdvAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L27) `packages/security/src/semantics/types.ts`

```ts
export type SecurityAdvAxis = 'mtls' | 'zero-trust' | 'siem-audit' | 'incident-response' | 'crypto-advanced' | 'container-k8s' | 'supply-chain' | 'web-vitals-security';
```

#### `SecurityAdvTarget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L25) `packages/security/src/semantics/types.ts`

Advanced Security semantics — provider-neutral axis SSOT (v0.2). Model 4 canonical security provider targets as pure state machines so kiwa fixture tests can assert on a neutral event name while still observing a provider-specific dialect through providerEventName. Provider targets (SDK 別 4): - istio ... Istio service mesh (mTLS + AuthorizationPolicy + PeerAuthentication) - opa ... Open Policy Agent (rego policy + zero-trust + admission control) - siem-splunk ... Splunk Enterprise SIEM (structured audit log + correlation) - vault ... HashiCorp Vault (KDF + envelope + key rotation + HSM 経路) Axes (8): - mtls ... mutual TLS + certificate pinning + OCSP stapling + CT log - zero-trust ... device posture + risk score + JIT + micro-segmentation - siem-audit ... structured + tamper-evident + retention + correlation rule - incident-response ... playbook + severity + escalation + forensics + post-mortem - crypto-advanced ... AEAD + KDF + envelope + key rotation + HSM + post-quantum - container-k8s ... pod security policy + network policy + admission controller - supply-chain ... SLSA level + reproducible build + signed provenance + attestation - web-vitals-security ... SRI + trusted types + permissions policy + cross-origin isolation

```ts
export type SecurityAdvTarget = 'istio' | 'opa' | 'siem-splunk' | 'vault';
```

#### `SecurityAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L19) `packages/security/src/types.ts`

8 axis の識別子。 SSOT なので追加変更は quality-metrics `SECURITY_AXES` と同期する必要がある。

```ts
export type SecurityAxis = 'csp' | 'rate-limit' | 'authorization' | 'waf' | 'threat-model' | 'secrets-scan' | 'sbom' | 'security-headers';
```

#### `SecurityDriver`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L67) `packages/security/src/types.ts`

driver 共通契約 — real / mock 両方に同じ shape で実装される。 fidelity harness が同一 scenario を real と mock に投げて event 列を照合する。

```ts
export interface SecurityDriver {
    readonly provider: SecurityProvider;
    readonly axis: SecurityAxis;
    runScenario(scenarioId: string): Promise<SecurityEvent[]>;
    reset(): void;
}
```

#### `SecurityEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L53) `packages/security/src/types.ts`

統一 mock 経路の共通 event — 4 provider adapter が emit する 全 event 列を fidelity harness で照合する。

```ts
export interface SecurityEvent<TPayload = unknown> {
    axis: SecurityAxis;
    provider: SecurityProvider;
    verdict: SecurityVerdict;
    reason: string;
    payload: TPayload;
    /** event 発火の相対 timestamp (ms、 collector 起点)。 */
    timestamp: number;
}
```

#### `SecurityFidelityInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L18) `packages/security/src/fidelity.ts`

```ts
export interface SecurityFidelityInput {
    provider: SecurityProvider;
    axis: SecurityAxis;
    realDriver: SecurityDriver;
    mockDriver: SecurityDriver;
    scenarios: string[];
    perScenarioTimeoutMs?: number;
}
```

#### `SecurityFidelityRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L27) `packages/security/src/fidelity.ts`

```ts
export interface SecurityFidelityRecord {
    scenarioId: string;
    provider: SecurityProvider;
    axis: SecurityAxis;
    real: SecurityEvent[];
    mock: SecurityEvent[];
    /** event 数の差 (real - mock)。 */
    eventCountDiff: number;
    /** verdict 一致率 0-1 (real と mock の verdict 列)。 */
    verdictMatch: number;
    /** reason 一致率 0-1 (loose match)。 */
    reasonMatch: number;
    /** 総合 accuracy score 0-1 (verdict * reason の平均)。 */
    accuracyScore: number;
}
```

#### `SecurityFidelityReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L43) `packages/security/src/fidelity.ts`

```ts
export interface SecurityFidelityReport {
    records: SecurityFidelityRecord[];
    summary: {
        scenarios: number;
        avgAccuracyScore: number;
        avgEventCountDiff: number;
        avgVerdictMatch: number;
        avgReasonMatch: number;
        accuracyMethod: 'sequence-jaccard';
    };
}
```

#### `SecurityHeadersInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L65) `packages/security/src/security-headers.ts`

```ts
export interface SecurityHeadersInput {
    hsts?: HstsOptions;
    xFrame?: XFrameOption;
    /** nosniff は固定なので on/off だけ。 */
    xContentTypeOptions?: boolean;
    referrerPolicy?: ReferrerPolicyValue;
    permissionsPolicy?: Partial<Record<PermissionsFeature, PermissionsSource>>;
}
```

#### `SecurityHeadersOutput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L74) `packages/security/src/security-headers.ts`

```ts
export interface SecurityHeadersOutput {
    headers: Record<string, string>;
}
```

#### `SecurityProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L33) `packages/security/src/types.ts`

4 provider の識別子。 v0.1 でカバーする provider adapter は 4 種類固定 (fidelity harness の 32 grid 前提)。

```ts
export type SecurityProvider = 'helmet' | 'express-rate-limit' | 'casbin' | 'coraza';
```

#### `SecurityVerdict`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L47) `packages/security/src/types.ts`

8 axis 全部の判定 verdict の共通契約。

```ts
export type SecurityVerdict = 'allow' | 'deny' | 'warn';
```

#### `SegmentPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L47) `packages/security/src/semantics/zero-trust.ts`

```ts
export interface SegmentPolicy {
    workload: string;
    allowedPeers: string[];
    requestedPeer: string;
}
```

#### `SeverityInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L42) `packages/security/src/semantics/incident-response.ts`

```ts
export interface SeverityInput {
    affectedUsers: number;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    serviceDown: boolean;
}
```

#### `SiemAuditSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L36) `packages/security/src/semantics/siem-audit.ts`

```ts
export interface SiemAuditSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: SiemAuditState;
    history: AxisAdvStep<SiemAuditState>[];
    structuredEvents: StructuredEvent[];
    sealHashChain: string[];
}
```

#### `SiemAuditState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L16) `packages/security/src/semantics/siem-audit.ts`

SIEM / audit log axis — structured logging + tamper-evident sealing + retention policy + correlation rule state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では Splunk / Elastic SIEM に HEC endpoint 経由で event を送信する。

```ts
export type SiemAuditState = 'idle' | 'structured' | 'sealed' | 'retention-tagged' | 'correlated';
```

#### `SiemEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L23) `packages/security/src/semantics/siem-audit.ts`

```ts
export interface SiemEvent {
    actor: string;
    action: string;
    target: string;
    timestamp: number;
    result: 'success' | 'failure';
}
```

#### `SlidingWindowConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L135) `packages/security/src/rate-limit.ts`

Sliding window — time window の request timestamp 全部を記録し、 過去 windowMs 内の count で判定する経路。

```ts
export interface SlidingWindowConfig {
    windowMs: number;
    maxRequests: number;
}
```

#### `SlsaLevel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L16) `packages/security/src/semantics/supply-chain.ts`

Supply chain security axis — SLSA level verification + reproducible build matching + signed provenance + SLSA attestation verification state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では in-toto / sigstore に対して attestation 検証を発火する。

```ts
export type SlsaLevel = 0 | 1 | 2 | 3 | 4;
```

#### `SlsaLevelInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L33) `packages/security/src/semantics/supply-chain.ts`

```ts
export interface SlsaLevelInput {
    buildScriptedFromRepo: boolean;
    buildServiceIsTrustworthy: boolean;
    buildParameterizable: boolean;
    buildIsolated: boolean;
    provenanceExists: boolean;
    provenanceAuthenticated: boolean;
    provenanceServiceGenerated: boolean;
    provenanceNonFalsifiable: boolean;
}
```

#### `SriInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L32) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export interface SriInput {
    resourceUrl: string;
    integrity: string;
    computedHash: string;
}
```

#### `StrideCategory`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L13) `packages/security/src/threat-model.ts`

```ts
export type StrideCategory = 'spoofing' | 'tampering' | 'repudiation' | 'information-disclosure' | 'denial-of-service' | 'elevation-of-privilege';
```

#### `StrideThreat`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L21) `packages/security/src/threat-model.ts`

```ts
export interface StrideThreat {
    id: string;
    category: StrideCategory;
    description: string;
    /** 1-5 severity。 */
    severity: 1 | 2 | 3 | 4 | 5;
}
```

#### `StructuredEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L31) `packages/security/src/semantics/siem-audit.ts`

```ts
export interface StructuredEvent extends SiemEvent {
    eventId: string;
    cimSchemaVersion: string;
}
```

#### `SupplyChainSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L25) `packages/security/src/semantics/supply-chain.ts`

```ts
export interface SupplyChainSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: SupplyChainState;
    history: AxisAdvStep<SupplyChainState>[];
    verifiedLevel: SlsaLevel;
}
```

#### `SupplyChainState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L18) `packages/security/src/semantics/supply-chain.ts`

```ts
export type SupplyChainState = 'idle' | 'slsa-verified' | 'reproducible-matched' | 'provenance-signed' | 'attestation-verified';
```

#### `TokenBucketConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L24) `packages/security/src/rate-limit.ts`

Token bucket — burst 対応 (max capacity まで貯蓄可)、 constant refill 経路。

```ts
export interface TokenBucketConfig {
    capacity: number;
    /** ms あたりの refill 量 (float 可、 内部で fraction accumulator)。 */
    refillPerMs: number;
}
```

#### `TrustedTypesInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L38) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export interface TrustedTypesInput {
    policyNames: string[];
    requireForScript: boolean;
    reportOnly: boolean;
}
```

#### `TrustZone`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L141) `packages/security/src/threat-model.ts`

Trust boundary — DFD-style zone crossing modeler。 subject と resource が異なる trust zone を跨ぐ dataflow は mitigation (authn / authz / encryption) を必ず要求する。

```ts
export interface TrustZone {
    id: string;
    label: string;
    /** 0=untrusted / 1=partially / 2=trusted。 */
    level: 0 | 1 | 2;
}
```

#### `WafDecision`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L38) `packages/security/src/waf.ts`

```ts
export interface WafDecision {
    action: WafRuleAction;
    matchedRuleId: string | null;
    matchedCategory: string | null;
    reason: string;
}
```

#### `WafPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L81) `packages/security/src/waf.ts`

```ts
export interface WafPolicy {
    rules: WafRule[];
}
```

#### `WafRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L14) `packages/security/src/waf.ts`

WAF が判定する request の共通形状。

```ts
export interface WafRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    body?: string;
    ip?: string;
}
```

#### `WafRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L25) `packages/security/src/waf.ts`

```ts
export interface WafRule {
    id: string;
    /** OWASP CRS category (WAF_XSS / WAF_SQLI / WAF_LFI / WAF_RFI 等)。 */
    category: string;
    /** 適合すれば match、 検査対象は request.path + body の join 検査。 */
    pattern: RegExp;
    action: WafRuleAction;
    /** 大きいほど先に評価。 default 100。 */
    priority?: number;
    /** false positive suppression 用の exception path。 */
    exceptionPaths?: string[];
}
```

#### `WafRuleAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L23) `packages/security/src/waf.ts`

```ts
export type WafRuleAction = 'block' | 'warn' | 'allow';
```

#### `WvsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L25) `packages/security/src/semantics/web-vitals-security.ts`

```ts
export interface WvsSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: WvsState;
    history: AxisAdvStep<WvsState>[];
}
```

#### `WvsState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L17) `packages/security/src/semantics/web-vitals-security.ts`

Web Vitals security axis — Subresource Integrity (SRI) hash + Trusted Types + Permissions Policy + Cross-Origin Isolation (COOP/COEP) enforcement state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では headless browser (Playwright) に対して response header を発火する。

```ts
export type WvsState = 'idle' | 'sri-verified' | 'trusted-types-enforced' | 'permissions-policy-applied' | 'cross-origin-isolated' | 'failed';
```

#### `XFrameOption`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L20) `packages/security/src/security-headers.ts`

```ts
export type XFrameOption = {
    mode: 'DENY';
} | {
    mode: 'SAMEORIGIN';
} | {
    mode: 'ALLOW-FROM';
    uri: string;
};
```

#### `ZeroTrustSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L25) `packages/security/src/semantics/zero-trust.ts`

```ts
export interface ZeroTrustSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: ZeroTrustState;
    history: AxisAdvStep<ZeroTrustState>[];
    riskScore: number;
    grantedRoles: string[];
}
```

#### `ZeroTrustState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L17) `packages/security/src/semantics/zero-trust.ts`

Zero-trust axis — device posture + risk scoring + Just-in-Time access + micro-segmentation state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では OPA rego policy や Google BeyondCorp 相当の verifier に対して posture 判定を 発火する。

```ts
export type ZeroTrustState = 'idle' | 'posture-evaluated' | 'risk-scored' | 'jit-granted' | 'jit-denied' | 'segment-enforced';
```
<!-- kiwa-public-api:end -->
