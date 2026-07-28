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
| <code v-pre>rbac: role hierarchy cycle detected at "$&#123;name&#125;"</code> | [packages/security/src/authorization.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L43) |
| <code v-pre>csp: strict-dynamic requires at least one nonce or hash in script-src (otherwise the whole policy has no effect)</code> | [packages/security/src/csp.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L146) |
| <code v-pre>sliding-window: windowMs must be &gt; 0</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L147) |
| <code v-pre>sliding-window: maxRequests must be &gt; 0</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L150) |
| <code v-pre>distributed: shards must be &gt; 0</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L196) |
| <code v-pre>client-id: ip missing</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L244) |
| <code v-pre>client-id: userId missing</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L247) |
| <code v-pre>client-id: apiKey missing</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L250) |
| <code v-pre>token-bucket: capacity must be &gt; 0</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L38) |
| <code v-pre>token-bucket: refillPerMs must be &gt; 0</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L41) |
| <code v-pre>leaky-bucket: capacity must be &gt; 0</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L92) |
| <code v-pre>leaky-bucket: drainPerMs must be &gt; 0</code> | [packages/security/src/rate-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L95) |
| <code v-pre>hsts: maxAgeSec must be &gt;= 0 (got $&#123;hsts.maxAgeSec&#125;)</code> | [packages/security/src/security-headers.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L106) |
| <code v-pre>hsts: preload requires includeSubDomains + maxAgeSec &gt;= 31536000 (1 year) per Chrome policy</code> | [packages/security/src/security-headers.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L109) |
| <code v-pre>applyNetworkPolicy: pod security must be enforced first</code> | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L107) |
| <code v-pre>applyNetworkPolicy: podSelector must not be empty</code> | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L110) |
| <code v-pre>decideAdmission: network policy must be applied first</code> | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L127) |
| <code v-pre>startK8sSession: sessionId must not be empty</code> | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L61) |
| <code v-pre>enforcePodSecurity: session is $&#123;session.state&#125;</code> | [packages/security/src/semantics/container-k8s.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L78) |
| <code v-pre>deriveKey: salt must be &gt;= 8 bytes</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L107) |
| <code v-pre>deriveKey: iterations must be &gt;= 1</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L110) |
| <code v-pre>deriveKey: password-based KDF requires &gt;= 10000 iterations</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L113) |
| <code v-pre>wrapEnvelope: cek and kek must not be empty</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L129) |
| <code v-pre>rotateKey: oldKeyId and newKeyId must differ</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L144) |
| <code v-pre>rotateKey: key ids must not be empty</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L147) |
| <code v-pre>signWithHsm: digest must not be empty</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L163) |
| <code v-pre>signWithHsm: keyId must not be empty</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L166) |
| <code v-pre>encapsulatePq: ML-KEM public key must be &gt;= 800 bytes</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L181) |
| <code v-pre>startCryptoSession: sessionId must not be empty</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L78) |
| <code v-pre>sealAead: lengths must be non-negative</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L91) |
| <code v-pre>sealAead: plaintext &gt; 64MB not supported by mock</code> | [packages/security/src/semantics/crypto-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L94) |
| <code v-pre>classifySeverity: playbook must be triggered first</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L108) |
| <code v-pre>classifySeverity: affectedUsers must be non-negative</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L111) |
| <code v-pre>escalate: severity must be classified first</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L135) |
| <code v-pre>escalate: at least one channel required</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L138) |
| <code v-pre>escalate: primary on-call must be assigned</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L141) |
| <code v-pre>captureForensics: escalation must complete first</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L157) |
| <code v-pre>captureForensics: artifact sizes must be non-negative</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L160) |
| <code v-pre>recordPostMortem: forensics must be captured first</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L179) |
| <code v-pre>recordPostMortem: rootCause must be &gt;= 10 chars</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L182) |
| <code v-pre>recordPostMortem: must have &gt;= 1 action item</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L185) |
| <code v-pre>startIncidentSession: sessionId must not be empty</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L71) |
| <code v-pre>triggerPlaybook: session is $&#123;session.state&#125;, must be idle</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L89) |
| <code v-pre>triggerPlaybook: playbookId must not be empty</code> | [packages/security/src/semantics/incident-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L92) |
| <code v-pre>verifyOcsp: session is $&#123;session.state&#125;, need handshake / pin first</code> | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L113) |
| <code v-pre>checkCtLog: session is $&#123;session.state&#125;, must have handshake first</code> | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L128) |
| <code v-pre>checkCtLog: minSctRequired must be non-negative</code> | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L131) |
| <code v-pre>startMtlsSession: sessionId must not be empty</code> | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L59) |
| <code v-pre>completeHandshake: session is $&#123;session.state&#125;, cannot handshake</code> | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L75) |
| <code v-pre>completeHandshake: only TLS 1.2 / 1.3 supported</code> | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L78) |
| <code v-pre>verifyPin: session is $&#123;session.state&#125;, must have completed handshake</code> | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L90) |
| <code v-pre>verifyPin: expectedPins must not be empty</code> | [packages/security/src/semantics/mtls.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L93) |
| <code v-pre>sealEvents: no structured events to seal</code> | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L106) |
| <code v-pre>sealEvents: 0 structured events, cannot seal empty batch</code> | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L109) |
| <code v-pre>applyRetention: events must be sealed first</code> | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L127) |
| <code v-pre>applyRetention: retention days must be non-negative</code> | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L130) |
| <code v-pre>correlate: retention must be applied first</code> | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L148) |
| <code v-pre>correlate: rule must require &gt;= 1 event id</code> | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L151) |
| <code v-pre>startSiemAuditSession: sessionId must not be empty</code> | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L63) |
| <code v-pre>structureEvent: session is $&#123;session.state&#125;, cannot structure</code> | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L80) |
| <code v-pre>structureEvent: actor / action / target must not be empty</code> | [packages/security/src/semantics/siem-audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L83) |
| <code v-pre>matchReproducibleBuild: SLSA level must be verified first</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L111) |
| <code v-pre>matchReproducibleBuild: build hashes must not be empty</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L114) |
| <code v-pre>signProvenance: reproducible build must be matched first</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L131) |
| <code v-pre>signProvenance: builderId must not be empty</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L134) |
| <code v-pre>signProvenance: materialsCount must be non-negative</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L137) |
| <code v-pre>verifyAttestation: provenance must be signed first</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L152) |
| <code v-pre>verifyAttestation: trustRootFingerprint must not be empty</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L155) |
| <code v-pre>verifyAttestation: at least one valid signature required</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L158) |
| <code v-pre>startSupplyChainSession: sessionId must not be empty</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L67) |
| <code v-pre>verifySlsaLevel: session is $&#123;session.state&#125;</code> | [packages/security/src/semantics/supply-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L83) |
| <code v-pre>enforceTrustedTypes: at least one policy name required</code> | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L100) |
| <code v-pre>applyPermissionsPolicy: trusted types must be enforced first</code> | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L115) |
| <code v-pre>applyPermissionsPolicy: at least one feature required</code> | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L118) |
| <code v-pre>enforceCrossOriginIsolation: permissions policy must be applied first</code> | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L133) |
| <code v-pre>startWvsSession: sessionId must not be empty</code> | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L62) |
| <code v-pre>verifySri: session is $&#123;session.state&#125;</code> | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L74) |
| <code v-pre>verifySri: integrity and computedHash must not be empty</code> | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L77) |
| <code v-pre>verifySri: integrity must start with sha256- / sha384- / sha512-</code> | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L80) |
| <code v-pre>enforceTrustedTypes: SRI must be verified first</code> | [packages/security/src/semantics/web-vitals-security.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L97) |
| <code v-pre>requestJit: risk must be scored first</code> | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L122) |
| <code v-pre>requestJit: ttlSeconds must be 1..3600</code> | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L125) |
| <code v-pre>requestJit: justification must be &gt;= 10 chars</code> | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L128) |
| <code v-pre>enforceMicroSegment: JIT must be granted first</code> | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L150) |
| <code v-pre>startZeroTrustSession: sessionId must not be empty</code> | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L58) |
| <code v-pre>evaluatePosture: session is $&#123;session.state&#125;, must be idle</code> | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L75) |
| <code v-pre>scoreRisk: posture must be evaluated first</code> | [packages/security/src/semantics/zero-trust.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L99) |
| <code v-pre>dread: factor out of range ($&#123;v&#125;); must be 1..10</code> | [packages/security/src/threat-model.ts](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L126) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/security/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>addCustomRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L90) <code v-pre>packages/security/src/waf.ts</code>

```ts
export declare function addCustomRule(policy: WafPolicy, rule: WafRule): WafPolicy;
```

#### <code v-pre>ADV&#95;API&#95;KEY&#95;ENV&#95;KEY</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L24) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare const ADV_API_KEY_ENV_KEY: Record<SecurityAdvTarget, string>;
```

#### <code v-pre>ADV&#95;ENDPOINT&#95;ENV&#95;KEY</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L17) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare const ADV_ENDPOINT_ENV_KEY: Record<SecurityAdvTarget, string>;
```

#### <code v-pre>ADV&#95;REQUIRED&#95;KEYS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L31) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare const ADV_REQUIRED_KEYS: Record<SecurityAdvTarget, string[]>;
```

#### <code v-pre>applyNetworkPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L102) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export declare function applyNetworkPolicy(session: K8sSession, policy: NetworkPolicySpec): AxisAdvStep<K8sState>;
```

#### <code v-pre>applyPermissionsPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L110) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function applyPermissionsPolicy(session: WvsSession, input: PermissionsPolicyInput): AxisAdvStep<WvsState>;
```

#### <code v-pre>applyRetention</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L122) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function applyRetention(session: SiemAuditSession, policy: RetentionPolicy): AxisAdvStep<SiemAuditState>;
```

#### <code v-pre>buildAdvRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L101) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function buildAdvRealDriverConfig(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): AdvRealDriverConfig;
```

#### <code v-pre>buildCspHeader</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L106) <code v-pre>packages/security/src/csp.ts</code>

CSP header を SSOT 定義から build する。 nonce / hash / strict-dynamic は 5 sub-axis の中で最も間違えやすい組合せ (nonce が同 header 内 2 回以上 出ると browser reject / strict-dynamic は nonce or hash なしに書くと whole policy が effect なし) を build 段階で予防する。

```ts
export declare function buildCspHeader(input: CspPolicyInput): CspHeaderOutput;
```

#### <code v-pre>buildSecurityHeaders</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L78) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export declare function buildSecurityHeaders(input: SecurityHeadersInput): SecurityHeadersOutput;
```

#### <code v-pre>captureForensics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L152) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function captureForensics(session: IncidentSession, input: ForensicsInput): AxisAdvStep<IncidentState>;
```

#### <code v-pre>checkCtLog</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L126) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function checkCtLog(session: MtlsSession, input: CtLogInput): AxisAdvStep<MtlsState>;
```

#### <code v-pre>classifySeverity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L103) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function classifySeverity(session: IncidentSession, input: SeverityInput): AxisAdvStep<IncidentState>;
```

#### <code v-pre>collectAdvFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L84) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

```ts
export declare function collectAdvFidelityCoverage(providers?: SecurityAdvTarget[]): AdvFidelityCoverage;
```

#### <code v-pre>completeHandshake</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L70) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function completeHandshake(session: MtlsSession, input: HandshakeInput): AxisAdvStep<MtlsState>;
```

#### <code v-pre>correlate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L143) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function correlate(session: SiemAuditSession, rule: CorrelationRule): AxisAdvStep<SiemAuditState>;
```

#### <code v-pre>createRbacPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L29) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function createRbacPolicy(roles: RbacRole[]): RbacPolicy;
```

#### <code v-pre>createWafPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L85) <code v-pre>packages/security/src/waf.ts</code>

```ts
export declare function createWafPolicy(rules?: WafRule[]): WafPolicy;
```

#### <code v-pre>decideAdmission</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L121) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export declare function decideAdmission(session: K8sSession, request: AdmissionRequest, input: {
    requireLabel: string;
    allowedNamespaces: string[];
}): AxisAdvStep<K8sState>;
```

#### <code v-pre>DEFAULT&#95;LICENSE&#95;POLICY</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L163) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export declare const DEFAULT_LICENSE_POLICY: LicensePolicy;
```

#### <code v-pre>DEFAULT&#95;SIGNATURES</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L35) <code v-pre>packages/security/src/secrets-scan.ts</code>

TruffleHog + Gitleaks 由来の代表 signature を SSOT 化。 実 signature 全網羅は upstream に譲り、 kiwa fixture test で よく参照される 8 kind に絞る。

```ts
export declare const DEFAULT_SIGNATURES: SecretSignature[];
```

#### <code v-pre>deriveKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L105) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function deriveKey(session: CryptoSession, input: KdfInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>detectBoundaryCrossings</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L164) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function detectBoundaryCrossings(zones: TrustZone[], flows: DataFlow[], membership: Map<string, string>): BoundaryCrossing[];
```

#### <code v-pre>DistributedRateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L190) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare class DistributedRateLimiter {
    constructor(config: DistributedRateLimitConfig);
    check(clientId: string, nowMs?: number): RateLimitDecision;
}
```

#### <code v-pre>encapsulatePq</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L176) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function encapsulatePq(session: CryptoSession, input: PqKemInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>enforceCrossOriginIsolation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L128) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function enforceCrossOriginIsolation(session: WvsSession, input: CrossOriginInput): AxisAdvStep<WvsState>;
```

#### <code v-pre>enforceMicroSegment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L145) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function enforceMicroSegment(session: ZeroTrustSession, policy: SegmentPolicy): AxisAdvStep<ZeroTrustState>;
```

#### <code v-pre>enforcePodSecurity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L72) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export declare function enforcePodSecurity(session: K8sSession, level: PodSecurityLevel, pod: PodSpec): AxisAdvStep<K8sState>;
```

#### <code v-pre>enforceTrustedTypes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L92) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function enforceTrustedTypes(session: WvsSession, input: TrustedTypesInput): AxisAdvStep<WvsState>;
```

#### <code v-pre>escalate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L130) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function escalate(session: IncidentSession, input: EscalationInput): AxisAdvStep<IncidentState>;
```

#### <code v-pre>evaluateAbac</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L119) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function evaluateAbac(policy: AbacPolicy, attrs: AbacAttributes): AbacDecision;
```

#### <code v-pre>evaluateCombined</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L160) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function evaluateCombined(input: CombinedPolicyInput): AbacDecision;
```

#### <code v-pre>evaluateLicense</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L169) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export declare function evaluateLicense(license: string | undefined, policy?: LicensePolicy): LicenseVerdict;
```

#### <code v-pre>evaluatePosture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L70) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function evaluatePosture(session: ZeroTrustSession, posture: DevicePosture): AxisAdvStep<ZeroTrustState>;
```

#### <code v-pre>evaluateWaf</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L94) <code v-pre>packages/security/src/waf.ts</code>

```ts
export declare function evaluateWaf(policy: WafPolicy, request: WafRequest): WafDecision;
```

#### <code v-pre>expandRoles</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L57) <code v-pre>packages/security/src/authorization.ts</code>

Given a subject, expand its assigned roles through the parent hierarchy and collect the transitive permission set. Used by the RBAC evaluator.

```ts
export declare function expandRoles(policy: RbacPolicy, subject: RbacSubject): Set<string>;
```

#### <code v-pre>isKiwaAdvModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L13) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function isKiwaAdvModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>isKiwaModeReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L60) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export declare function isKiwaModeReal(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>isRotationOverdue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L156) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export declare function isRotationOverdue(tracker: RotationTracker, nowMs?: number): boolean;
```

#### <code v-pre>LeakyBucket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L84) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare class LeakyBucket {
    constructor(config: LeakyBucketConfig, nowMs?: number);
    enqueue(count: number, nowMs?: number): RateLimitDecision;
}
```

#### <code v-pre>lookupAdvisories</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L126) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export declare function lookupAdvisories(doc: SbomDocument, feed: AdvisoryFeed): AdvisoryLookupResult[];
```

#### <code v-pre>markRotated</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L163) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export declare function markRotated(tracker: RotationTracker, atMs?: number): RotationTracker;
```

#### <code v-pre>matchReproducibleBuild</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L106) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function matchReproducibleBuild(session: SupplyChainSession, input: ReproducibleInput): AxisAdvStep<SupplyChainState>;
```

#### <code v-pre>OWASP&#95;CRS&#95;DEFAULT</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L46) <code v-pre>packages/security/src/waf.ts</code>

OWASP CRS の代表 rule id を kiwa が使う shape に写像した既定 rule 集。

```ts
export declare const OWASP_CRS_DEFAULT: WafRule[];
```

#### <code v-pre>pastaCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L68) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function pastaCoverage(findings: PastaFinding[]): {
    overallCompleteness: number;
    perStage: Record<PastaStage, number>;
    gaps: PastaStage[];
};
```

#### <code v-pre>providerAdvEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L241) <code v-pre>packages/security/src/semantics/types.ts</code>

```ts
export declare function providerAdvEventName(target: SecurityAdvTarget, neutral: NeutralAdvEventName): string;
```

#### <code v-pre>rbacAllows</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L75) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function rbacAllows(policy: RbacPolicy, subject: RbacSubject, permission: string): boolean;
```

#### <code v-pre>REAL&#95;DRIVER&#95;REQUIRED&#95;KEYS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L13) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export declare const REAL_DRIVER_REQUIRED_KEYS: Record<SecurityProvider, string[]>;
```

#### <code v-pre>reasonSimilarity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L112) <code v-pre>packages/security/src/fidelity.ts</code>

```ts
export declare function reasonSimilarity(real: SecurityEvent[], mock: SecurityEvent[]): number;
```

#### <code v-pre>recordPostMortem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L174) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function recordPostMortem(session: IncidentSession, input: PostMortemInput): AxisAdvStep<IncidentState>;
```

#### <code v-pre>requestJit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L117) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function requestJit(session: ZeroTrustSession, request: JitRequest): AxisAdvStep<ZeroTrustState>;
```

#### <code v-pre>resolveAdvApiKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L85) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function resolveAdvApiKey(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): string | null;
```

#### <code v-pre>resolveAdvEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L76) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function resolveAdvEndpoint(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): string | null;
```

#### <code v-pre>resolveAdvRealDriver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L49) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function resolveAdvRealDriver(input: AdvRealDriverGateInput): AdvRealDriverGateResult;
```

#### <code v-pre>resolveClientId</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L236) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare function resolveClientId(input: {
    kind: ClientIdKind;
    ip?: string;
    userId?: string;
    apiKey?: string;
}): string;
```

#### <code v-pre>resolveEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L89) <code v-pre>packages/security/src/real-driver.ts</code>

provider 別の endpoint / api key を env から解決する。 testcontainers container の host / port 情報を渡す想定。

```ts
export declare function resolveEndpoint(provider: SecurityProvider, env?: NodeJS.ProcessEnv): RealDriverEndpoint;
```

#### <code v-pre>resolveRealtimeDriver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L35) <code v-pre>packages/security/src/real-driver.ts</code>

env の状態から real driver を使うかどうか判定する。 KIWA_MODE=real + provider 別必須 env が揃った時のみ true。

```ts
export declare function resolveRealtimeDriver(input: RealDriverGateInput): RealDriverGateResult;
```

#### <code v-pre>rotateKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L139) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function rotateKey(session: CryptoSession, input: KeyRotationInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>runSecurityFidelityCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L55) <code v-pre>packages/security/src/fidelity.ts</code>

```ts
export declare function runSecurityFidelityCheck(input: SecurityFidelityInput): Promise<SecurityFidelityReport>;
```

#### <code v-pre>scanSecrets</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L111) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export declare function scanSecrets(source: string, signatures?: SecretSignature[]): SecretFinding[];
```

#### <code v-pre>scoreDread</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L116) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function scoreDread(input: DreadInput): DreadResult;
```

#### <code v-pre>scoreRisk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L89) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function scoreRisk(session: ZeroTrustSession, input: {
    unusualLocation: boolean;
    unusualTime: boolean;
    newDevice: boolean;
    threatIntelHit: boolean;
}): AxisAdvStep<ZeroTrustState>;
```

#### <code v-pre>scoreStride</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L29) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function scoreStride(threats: StrideThreat[]): {
    total: number;
    byCategory: Record<StrideCategory, number>;
    highest: StrideThreat | null;
};
```

#### <code v-pre>sealAead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L89) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function sealAead(session: CryptoSession, input: AeadInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>sealEvents</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L101) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function sealEvents(session: SiemAuditSession, input: {
    previousHash: string;
}): AxisAdvStep<SiemAuditState>;
```

#### <code v-pre>SECURITY&#95;ADV&#95;AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L30) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

```ts
export declare const SECURITY_ADV_AXIS_TO_EVENTS: Record<SecurityAdvAxis, NeutralAdvEventName[]>;
```

#### <code v-pre>SECURITY&#95;ADV&#95;FIDELITY&#95;GRID</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L100) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

provider × axis = 4 × 8 = 32 grid の SSOT 列挙。

```ts
export declare const SECURITY_ADV_FIDELITY_GRID: Array<{
    provider: SecurityAdvTarget;
    axis: SecurityAdvAxis;
}>;
```

#### <code v-pre>SECURITY&#95;FIDELITY&#95;GRID</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L164) <code v-pre>packages/security/src/fidelity.ts</code>

32 grid の全 combination を SSOT で列挙 — provider x axis の どの組合せが fidelity harness の一次対象か明示する。

```ts
export declare const SECURITY_FIDELITY_GRID: {
    provider: SecurityProvider;
    axis: SecurityAxis;
}[];
```

#### <code v-pre>shannonEntropy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L96) <code v-pre>packages/security/src/secrets-scan.ts</code>

Shannon entropy of a string over its own byte histogram. Values &gt;= 3.5 are typical for random secrets over base64/hex alphabets; anything closer to natural language sits well below.

```ts
export declare function shannonEntropy(input: string): number;
```

#### <code v-pre>signProvenance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L126) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function signProvenance(session: SupplyChainSession, input: ProvenanceInput): AxisAdvStep<SupplyChainState>;
```

#### <code v-pre>signWithHsm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L158) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function signWithHsm(session: CryptoSession, input: HsmSignInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>skipUnlessAdvReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L113) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export declare function skipUnlessAdvReal(provider: SecurityAdvTarget, env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

#### <code v-pre>skipUnlessReal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L68) <code v-pre>packages/security/src/real-driver.ts</code>

vitest 用 skip helper — describe block を real driver 未該当時に skip する経路の SSOT。 return.skip=true なら describe.skip 相当。

```ts
export declare function skipUnlessReal(provider: SecurityProvider, env?: NodeJS.ProcessEnv): {
    skip: boolean;
    reason: string;
};
```

#### <code v-pre>SlidingWindow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L140) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare class SlidingWindow {
    constructor(config: SlidingWindowConfig);
    record(nowMs?: number): RateLimitDecision;
}
```

#### <code v-pre>startCryptoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L73) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function startCryptoSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): CryptoSession;
```

#### <code v-pre>startIncidentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L66) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function startIncidentSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): IncidentSession;
```

#### <code v-pre>startK8sSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L56) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export declare function startK8sSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): K8sSession;
```

#### <code v-pre>startMtlsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L54) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function startMtlsSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): MtlsSession;
```

#### <code v-pre>startSiemAuditSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L58) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function startSiemAuditSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): SiemAuditSession;
```

#### <code v-pre>startSupplyChainSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L62) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function startSupplyChainSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): SupplyChainSession;
```

#### <code v-pre>startWvsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L57) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function startWvsSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): WvsSession;
```

#### <code v-pre>startZeroTrustSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L53) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export declare function startZeroTrustSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): ZeroTrustSession;
```

#### <code v-pre>structureEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L75) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export declare function structureEvent(session: SiemAuditSession, raw: SiemEvent): {
    step: AxisAdvStep<SiemAuditState>;
    event: StructuredEvent;
};
```

#### <code v-pre>suppressFalsePositive</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L122) <code v-pre>packages/security/src/waf.ts</code>

False positive suppression — allow-list per path で特定 rule を除外する partial policy override。 使い方は既存 policy + 部分 rule の rebuild。

```ts
export declare function suppressFalsePositive(policy: WafPolicy, ruleId: string, exceptionPath: string): WafPolicy;
```

#### <code v-pre>toAuthorizationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L176) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export declare function toAuthorizationEvent(input: {
    provider: 'casbin' | 'coraza';
    decision: AbacDecision;
    subject: string;
    action: string;
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>toCspEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L209) <code v-pre>packages/security/src/csp.ts</code>

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

#### <code v-pre>toCycloneDx</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L30) <code v-pre>packages/security/src/sbom.ts</code>

CycloneDX 1.5 minimal — components が bomFormat = "CycloneDX"、 specVersion = "1.5"。

```ts
export declare function toCycloneDx(components: SbomComponent[], nowIso?: string): SbomDocument;
```

#### <code v-pre>TokenBucket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L30) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare class TokenBucket {
    constructor(config: TokenBucketConfig, nowMs?: number);
    consume(count: number, nowMs?: number): RateLimitDecision;
}
```

#### <code v-pre>toRateLimitEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L255) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare function toRateLimitEvent(input: {
    provider: 'express-rate-limit' | 'coraza';
    decision: RateLimitDecision;
    clientId: string;
    strategy: RateLimitStrategy | 'distributed';
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>toSbomEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L186) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export declare function toSbomEvent(input: {
    provider: 'helmet' | 'coraza';
    verdict: 'allow' | 'deny' | 'warn';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>toSecretsEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L167) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export declare function toSecretsEvent(input: {
    provider: 'helmet' | 'coraza';
    finding: SecretFinding;
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>toSecurityHeadersEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L181) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export declare function toSecurityHeadersEvent(input: {
    provider: 'helmet';
    verdict: 'allow' | 'warn' | 'deny';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>toSpdx</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L40) <code v-pre>packages/security/src/sbom.ts</code>

SPDX 2.3 minimal — packages list + relationships (DESCRIBES / DEPENDS_ON)。

```ts
export declare function toSpdx(components: SbomComponent[], nowIso?: string): SbomDocument;
```

#### <code v-pre>toThreatModelEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L201) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export declare function toThreatModelEvent(input: {
    provider: 'coraza' | 'helmet';
    verdict: 'allow' | 'deny' | 'warn';
    reason: string;
    payload: unknown;
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>toWafEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L137) <code v-pre>packages/security/src/waf.ts</code>

```ts
export declare function toWafEvent(input: {
    provider: 'coraza' | 'helmet';
    decision: WafDecision;
    request: WafRequest;
    timestamp: number;
}): SecurityEvent;
```

#### <code v-pre>triggerPlaybook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L84) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export declare function triggerPlaybook(session: IncidentSession, input: PlaybookInput): AxisAdvStep<IncidentState>;
```

#### <code v-pre>validateNonce</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L194) <code v-pre>packages/security/src/csp.ts</code>

nonce 検証 — 同 header 内で同じ nonce が 2 回以上出ないか、 32 char 以上か。

```ts
export declare function validateNonce(nonce: string): {
    ok: boolean;
    reason: string;
};
```

#### <code v-pre>validateSbom</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L50) <code v-pre>packages/security/src/sbom.ts</code>

SBOM validation — mandatory fields + purl syntax check。

```ts
export declare function validateSbom(doc: SbomDocument): {
    ok: boolean;
    errors: string[];
};
```

#### <code v-pre>validateSecurityHeaders</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L153) <code v-pre>packages/security/src/security-headers.ts</code>

Header header 値の syntactic validation。 実 browser 実装との fidelity は fidelity harness 側で確認、 ここでは build 段階の misuse だけ検知。

```ts
export declare function validateSecurityHeaders(input: SecurityHeadersInput): {
    ok: boolean;
    errors: string[];
};
```

#### <code v-pre>verdictSimilarity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L102) <code v-pre>packages/security/src/fidelity.ts</code>

```ts
export declare function verdictSimilarity(real: SecurityEvent[], mock: SecurityEvent[]): number;
```

#### <code v-pre>verifyAttestation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L147) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function verifyAttestation(session: SupplyChainSession, input: AttestationInput): AxisAdvStep<SupplyChainState>;
```

#### <code v-pre>verifyOcsp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L111) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function verifyOcsp(session: MtlsSession, input: OcspInput): AxisAdvStep<MtlsState>;
```

#### <code v-pre>verifyPin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L88) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export declare function verifyPin(session: MtlsSession, input: PinInput): AxisAdvStep<MtlsState>;
```

#### <code v-pre>verifySlsaLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L78) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export declare function verifySlsaLevel(session: SupplyChainSession, input: SlsaLevelInput): AxisAdvStep<SupplyChainState>;
```

#### <code v-pre>verifySri</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L72) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export declare function verifySri(session: WvsSession, input: SriInput): AxisAdvStep<WvsState>;
```

#### <code v-pre>versionInRange</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L85) <code v-pre>packages/security/src/sbom.ts</code>

Simple semver "in range" check — accepts `&gt;= a.b.c`, `&lt; a.b.c`, `&lt; a.b.c || &gt;= x.y.z`, or an exact version string. Full semver range algebra is out of scope for the mock (real driver = actual OSV client)。

```ts
export declare function versionInRange(version: string, range: string): boolean;
```

#### <code v-pre>wrapEnvelope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L124) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function wrapEnvelope(session: CryptoSession, input: EnvelopeInput): AxisAdvStep<CryptoState>;
```

### 型

#### <code v-pre>AbacAttributes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L84) <code v-pre>packages/security/src/authorization.ts</code>

ABAC — subject / resource / action / environment 4 属性 + expression evaluator。

```ts
export interface AbacAttributes {
    subject: Record<string, unknown>;
    resource: Record<string, unknown>;
    action: string;
    environment: Record<string, unknown>;
}
```

#### <code v-pre>AbacCombiningAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L106) <code v-pre>packages/security/src/authorization.ts</code>

Rule combining algorithms follow XACML naming: - deny-overrides: any DENY wins - permit-overrides: any PERMIT wins - first-applicable: return the first rule that matches (default deny after)

```ts
export type AbacCombiningAlgo = 'deny-overrides' | 'permit-overrides' | 'first-applicable';
```

#### <code v-pre>AbacDecision</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L113) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface AbacDecision {
    effect: AbacRuleEffect;
    matchedRule: string | null;
    reason: string;
}
```

#### <code v-pre>AbacPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L108) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface AbacPolicy {
    rules: AbacRule[];
    algorithm: AbacCombiningAlgo;
}
```

#### <code v-pre>AbacRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L93) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface AbacRule {
    id: string;
    effect: AbacRuleEffect;
    /** Predicate against the 4 attribute buckets. */
    condition: (attrs: AbacAttributes) => boolean;
}
```

#### <code v-pre>AbacRuleEffect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L91) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export type AbacRuleEffect = 'permit' | 'deny';
```

#### <code v-pre>AdmissionRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L49) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export interface AdmissionRequest {
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: 'Pod' | 'Deployment' | 'Service' | 'ConfigMap';
    namespace: string;
    labels: Record<string, string>;
}
```

#### <code v-pre>AdvFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L24) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

```ts
export interface AdvFidelityCoverage {
    providers: SecurityAdvTarget[];
    axes: SecurityAdvAxis[];
    rows: AdvFidelityRow[];
}
```

#### <code v-pre>AdvFidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/fidelity.ts#L17) <code v-pre>packages/security/src/semantics/fidelity.ts</code>

4 provider × 8 axis = 32 combination advanced fidelity grid (v0.2)。 v0.1 の `SECURITY_FIDELITY_GRID` は provider {helmet / express-rate-limit / casbin / coraza} × 基礎 8 axis を扱う。 本 v0.2 grid は provider {istio / opa / siem-splunk / vault} × 高度 8 axis を扱い、 `SECURITY_FIDELITY_GRID` と直交する 2 段目の grid 構造。

```ts
export interface AdvFidelityRow {
    provider: SecurityAdvTarget;
    axis: SecurityAdvAxis;
    neutralEvents: NeutralAdvEventName[];
    providerEvents: string[];
}
```

#### <code v-pre>Advisory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L63) <code v-pre>packages/security/src/sbom.ts</code>

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

#### <code v-pre>AdvisoryFeed</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L71) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export interface AdvisoryFeed {
    advisories: Advisory[];
}
```

#### <code v-pre>AdvisoryLookupResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L75) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export interface AdvisoryLookupResult {
    component: SbomComponent;
    advisories: Advisory[];
}
```

#### <code v-pre>AdvRealDriverConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L94) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export interface AdvRealDriverConfig {
    provider: SecurityAdvTarget;
    endpoint: string | null;
    apiKey: string | null;
    timeoutMs: number;
}
```

#### <code v-pre>AdvRealDriverGateInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L38) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export interface AdvRealDriverGateInput {
    provider: SecurityAdvTarget;
    env?: NodeJS.ProcessEnv;
}
```

#### <code v-pre>AdvRealDriverGateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/real-driver.ts#L43) <code v-pre>packages/security/src/semantics/real-driver.ts</code>

```ts
export interface AdvRealDriverGateResult {
    useRealDriver: boolean;
    missingKeys: string[];
    reason: string;
}
```

#### <code v-pre>AeadAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L16) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

Cryptography advanced axis — AEAD + KDF + envelope encryption + key rotation + HSM signing + post-quantum KEM state machine。 Deterministic mock で 6 signal 系統を提供。 real driver 経路では Vault transit engine や AWS KMS / GCP KMS に対して encryption を発火する。

```ts
export type AeadAlgo = 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'AES-256-GCM-SIV';
```

#### <code v-pre>AeadInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L37) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface AeadInput {
    algo: AeadAlgo;
    plaintextLen: number;
    aadLen: number;
}
```

#### <code v-pre>AttestationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L56) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export interface AttestationInput {
    attestationType: 'slsa-provenance' | 'spdx-sbom' | 'cyclone-dx-vex';
    trustRootFingerprint: string;
    validSignatures: number;
}
```

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

#### <code v-pre>BoundaryCrossing</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L156) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface BoundaryCrossing {
    flow: DataFlow;
    fromZone: TrustZone;
    toZone: TrustZone;
    requiredMitigations: string[];
    missingMitigations: string[];
}
```

#### <code v-pre>ClientIdKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L234) <code v-pre>packages/security/src/rate-limit.ts</code>

Client identity keyspace resolver — IP / user / API-key の 3 通り。

```ts
export type ClientIdKind = 'ip' | 'user' | 'api-key';
```

#### <code v-pre>CombinedPolicyInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L155) <code v-pre>packages/security/src/authorization.ts</code>

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

#### <code v-pre>CorrelationRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L52) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export interface CorrelationRule {
    ruleId: string;
    requiredEventIds: string[];
    windowMs: number;
}
```

#### <code v-pre>CrossOriginInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L51) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface CrossOriginInput {
    coop: 'unsafe-none' | 'same-origin' | 'same-origin-allow-popups';
    coep: 'unsafe-none' | 'require-corp' | 'credentialless';
    corp: 'same-site' | 'same-origin' | 'cross-origin';
}
```

#### <code v-pre>CryptoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L29) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface CryptoSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: CryptoState;
    history: AxisAdvStep<CryptoState>[];
    currentKeyId: string | null;
}
```

#### <code v-pre>CryptoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L20) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export type CryptoState = 'idle' | 'aead-sealed' | 'kdf-derived' | 'envelope-wrapped' | 'key-rotated' | 'hsm-signed' | 'pq-encapsulated';
```

#### <code v-pre>CspDirective</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L18) <code v-pre>packages/security/src/csp.ts</code>

CSP directive の完全列挙 (Fetch directive + Document directive + Reporting)。

```ts
export type CspDirective = 'default-src' | 'script-src' | 'script-src-elem' | 'script-src-attr' | 'style-src' | 'style-src-elem' | 'style-src-attr' | 'img-src' | 'connect-src' | 'font-src' | 'frame-src' | 'frame-ancestors' | 'form-action' | 'base-uri' | 'object-src' | 'worker-src' | 'child-src' | 'media-src' | 'manifest-src' | 'trusted-types' | 'require-trusted-types-for' | 'upgrade-insecure-requests' | 'block-all-mixed-content' | 'report-uri' | 'report-to';
```

#### <code v-pre>CspHashAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L52) <code v-pre>packages/security/src/csp.ts</code>

```ts
export type CspHashAlgo = 'sha256' | 'sha384' | 'sha512';
```

#### <code v-pre>CspHashOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L54) <code v-pre>packages/security/src/csp.ts</code>

```ts
export interface CspHashOptions {
    algorithm: CspHashAlgo;
    /** Base64-encoded digest。 */
    digest: string;
    /** attach directive (default script-src)。 */
    directives?: CspDirective[];
}
```

#### <code v-pre>CspHeaderOutput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L82) <code v-pre>packages/security/src/csp.ts</code>

```ts
export interface CspHeaderOutput {
    headerName: 'Content-Security-Policy' | 'Content-Security-Policy-Report-Only';
    headerValue: string;
    /** 各 directive を key に持つ debug 用の展開後 map。 */
    expandedDirectives: Record<CspDirective, string[]>;
}
```

#### <code v-pre>CspNonceOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L45) <code v-pre>packages/security/src/csp.ts</code>

```ts
export interface CspNonceOptions {
    /** Base64URL-encoded random nonce (16-32 bytes)。 */
    nonce: string;
    /** attach directive (default script-src)。 */
    directives?: CspDirective[];
}
```

#### <code v-pre>CspPolicyInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/csp.ts#L62) <code v-pre>packages/security/src/csp.ts</code>

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

#### <code v-pre>CtLogInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L49) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface CtLogInput {
    sctCount: number;
    minSctRequired: number;
}
```

#### <code v-pre>DataFlow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L148) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface DataFlow {
    id: string;
    from: string;
    to: string;
    data: string;
    mitigations: string[];
}
```

#### <code v-pre>DevicePosture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L34) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export interface DevicePosture {
    osUpToDate: boolean;
    diskEncrypted: boolean;
    edrRunning: boolean;
    mdmEnrolled: boolean;
}
```

#### <code v-pre>DistributedRateLimitConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L184) <code v-pre>packages/security/src/rate-limit.ts</code>

Distributed keyspace mock — Redis-backed のような multi-node coordination を hash-shard で emulate する。 node 数 = shards、 各 shard は独立 counter。

```ts
export interface DistributedRateLimitConfig {
    shards: number;
    perShardMaxRequests: number;
    windowMs: number;
}
```

#### <code v-pre>DreadInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L102) <code v-pre>packages/security/src/threat-model.ts</code>

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

#### <code v-pre>DreadResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L110) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface DreadResult {
    total: number;
    average: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
```

#### <code v-pre>EnvelopeInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L50) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface EnvelopeInput {
    cek: string;
    kek: string;
    masterKeyProvider: 'kms' | 'vault' | 'hsm';
}
```

#### <code v-pre>EscalationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L48) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface EscalationInput {
    channels: string[];
    onCallPrimary: string;
    onCallSecondary: string | null;
}
```

#### <code v-pre>ForensicsInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L54) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface ForensicsInput {
    memoryDumpMb: number;
    networkPcapMb: number;
    diskImageGb: number;
}
```

#### <code v-pre>HandshakeInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L33) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface HandshakeInput {
    peerCn: string;
    cipherSuite: string;
    tlsVersion: '1.2' | '1.3';
}
```

#### <code v-pre>HsmSignInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L62) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface HsmSignInput {
    keyId: string;
    digest: string;
    algorithm: 'ECDSA-P256' | 'RSA-PSS-2048' | 'Ed25519';
}
```

#### <code v-pre>HstsOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L14) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export interface HstsOptions {
    maxAgeSec: number;
    includeSubDomains?: boolean;
    preload?: boolean;
}
```

#### <code v-pre>IncidentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L26) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

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

#### <code v-pre>IncidentSeverity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L16) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

Incident response axis — playbook trigger + severity classification + escalation + forensics capture + post-mortem recording state machine。 Deterministic mock で 5 signal 系統を提供。 real driver 経路では PagerDuty / Splunk Phantom SOAR platform への escalation を発火する。

```ts
export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'sev5';
```

#### <code v-pre>IncidentState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L18) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export type IncidentState = 'idle' | 'playbook-triggered' | 'severity-classified' | 'escalated' | 'forensics-captured' | 'post-mortem-recorded';
```

#### <code v-pre>JitRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L41) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export interface JitRequest {
    requestedRole: string;
    justification: string;
    ttlSeconds: number;
}
```

#### <code v-pre>K8sSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L25) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export interface K8sSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: K8sState;
    history: AxisAdvStep<K8sState>[];
    enforcedLevel: PodSecurityLevel | null;
}
```

#### <code v-pre>K8sState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L19) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export type K8sState = 'idle' | 'pod-security-enforced' | 'network-policy-applied' | 'admission-decided';
```

#### <code v-pre>KdfAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L17) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export type KdfAlgo = 'HKDF-SHA256' | 'HKDF-SHA512' | 'PBKDF2' | 'Argon2id' | 'scrypt';
```

#### <code v-pre>KdfInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L43) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface KdfInput {
    algo: KdfAlgo;
    saltLen: number;
    info: string;
    iterations: number;
}
```

#### <code v-pre>KeyRotationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L56) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface KeyRotationInput {
    oldKeyId: string;
    newKeyId: string;
    reason: 'scheduled' | 'compromised' | 'policy';
}
```

#### <code v-pre>LeakyBucketConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L78) <code v-pre>packages/security/src/rate-limit.ts</code>

Leaky bucket — queue-based、 steady-state throughput 保証。

```ts
export interface LeakyBucketConfig {
    capacity: number;
    /** queue drain rate (items per ms、 float 可)。 */
    drainPerMs: number;
}
```

#### <code v-pre>LicensePolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L157) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export interface LicensePolicy {
    allow: string[];
    warn: string[];
    deny: string[];
}
```

#### <code v-pre>LicenseVerdict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L155) <code v-pre>packages/security/src/sbom.ts</code>

License policy — SPDX license id ごとに allow / warn / deny 判定。

```ts
export type LicenseVerdict = 'allow' | 'warn' | 'deny';
```

#### <code v-pre>MtlsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L25) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface MtlsSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: MtlsState;
    history: AxisAdvStep<MtlsState>[];
    pinnedFingerprints: string[];
}
```

#### <code v-pre>MtlsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L17) <code v-pre>packages/security/src/semantics/mtls.ts</code>

mTLS + certificate pinning axis — mutual TLS handshake + pin verification + OCSP stapling + Certificate Transparency log check state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では実 istio / envoy sidecar に対して TLS handshake を張り、 SPKI pin と OCSP staple を 検証する。

```ts
export type MtlsState = 'idle' | 'handshake-completed' | 'pinned' | 'ocsp-verified' | 'ct-verified' | 'failed';
```

#### <code v-pre>NetworkPolicySpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L42) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

```ts
export interface NetworkPolicySpec {
    namespace: string;
    podSelector: Record<string, string>;
    ingressFromNamespaces: string[];
    egressToNamespaces: string[];
}
```

#### <code v-pre>NeutralAdvEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/types.ts#L37) <code v-pre>packages/security/src/semantics/types.ts</code>

```ts
export type NeutralAdvEventName = 'mtls.handshake_completed' | 'mtls.cert_pinned' | 'mtls.ocsp_verified' | 'mtls.ct_log_checked' | 'zt.device_posture_evaluated' | 'zt.risk_scored' | 'zt.jit_granted' | 'zt.micro_segment_enforced' | 'siem.event_structured' | 'siem.tamper_evident_sealed' | 'siem.retention_applied' | 'siem.correlation_matched' | 'ir.playbook_triggered' | 'ir.severity_classified' | 'ir.escalation_sent' | 'ir.forensics_captured' | 'ir.post_mortem_recorded' | 'crypto.aead_sealed' | 'crypto.kdf_derived' | 'crypto.envelope_wrapped' | 'crypto.key_rotated' | 'crypto.hsm_signed' | 'crypto.pq_kem_encapsulated' | 'k8s.pod_security_enforced' | 'k8s.network_policy_applied' | 'k8s.admission_denied' | 'k8s.admission_allowed' | 'sc.slsa_level_verified' | 'sc.reproducible_build_matched' | 'sc.provenance_signed' | 'sc.attestation_verified' | 'wvs.sri_hash_verified' | 'wvs.trusted_types_enforced' | 'wvs.permissions_policy_applied' | 'wvs.cross_origin_isolated';
```

#### <code v-pre>OcspInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L44) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface OcspInput {
    stapled: boolean;
    goodResponse: boolean;
}
```

#### <code v-pre>PastaFinding</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L61) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface PastaFinding {
    stage: PastaStage;
    summary: string;
    /** stage 単位 completeness 0-1 (test coverage proxy)。 */
    completeness: number;
}
```

#### <code v-pre>PastaStage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L52) <code v-pre>packages/security/src/threat-model.ts</code>

PASTA stage identifiers — 7 stage は Tony UcedaVélez / Marco Morana 定義に沿う。

```ts
export type PastaStage = 'define-objectives' | 'define-technical-scope' | 'application-decomposition' | 'threat-analysis' | 'vulnerability-analysis' | 'attack-modeling' | 'risk-analysis';
```

#### <code v-pre>PermissionsFeature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L36) <code v-pre>packages/security/src/security-headers.ts</code>

Permissions-Policy feature 名 — Chrome/Firefox で実装されている代表 feature。

```ts
export type PermissionsFeature = 'accelerometer' | 'ambient-light-sensor' | 'autoplay' | 'battery' | 'camera' | 'display-capture' | 'document-domain' | 'encrypted-media' | 'execution-while-not-rendered' | 'execution-while-out-of-viewport' | 'fullscreen' | 'geolocation' | 'gyroscope' | 'magnetometer' | 'microphone' | 'midi' | 'payment' | 'picture-in-picture' | 'publickey-credentials-get' | 'screen-wake-lock' | 'sync-xhr' | 'usb' | 'web-share' | 'xr-spatial-tracking';
```

#### <code v-pre>PermissionsPolicyInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L44) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface PermissionsPolicyInput {
    features: Array<{
        name: 'camera' | 'microphone' | 'geolocation' | 'payment' | 'usb' | 'gyroscope';
        allowlist: 'none' | 'self' | 'src' | string;
    }>;
}
```

#### <code v-pre>PermissionsSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L63) <code v-pre>packages/security/src/security-headers.ts</code>

allowlist source per feature — `*`, `self`, or explicit origin list.

```ts
export type PermissionsSource = '*' | 'self' | 'none' | {
    origins: string[];
};
```

#### <code v-pre>PinInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/mtls.ts#L39) <code v-pre>packages/security/src/semantics/mtls.ts</code>

```ts
export interface PinInput {
    spkiSha256: string;
    expectedPins: string[];
}
```

#### <code v-pre>PlaybookInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L36) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface PlaybookInput {
    playbookId: string;
    detectionSource: string;
    initialAlert: string;
}
```

#### <code v-pre>PodSecurityLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L17) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

Container / Kubernetes security axis — Pod Security Standard enforcement + NetworkPolicy application + Admission Controller (Gatekeeper / Kyverno) decision state machine。 Deterministic mock で 3 signal 系統 + 2 admission verdict を提供。 real driver 経路では OPA Gatekeeper に対して webhook を発火する。

```ts
export type PodSecurityLevel = 'privileged' | 'baseline' | 'restricted';
```

#### <code v-pre>PodSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/container-k8s.ts#L33) <code v-pre>packages/security/src/semantics/container-k8s.ts</code>

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

#### <code v-pre>PostMortemInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L60) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface PostMortemInput {
    rootCause: string;
    contributingFactors: string[];
    actionItems: string[];
}
```

#### <code v-pre>PqKemAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L18) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export type PqKemAlgo = 'ML-KEM-768' | 'ML-KEM-1024' | 'Kyber768';
```

#### <code v-pre>PqKemInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L68) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface PqKemInput {
    algo: PqKemAlgo;
    publicKeyLen: number;
}
```

#### <code v-pre>ProvenanceInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L50) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export interface ProvenanceInput {
    builderId: string;
    materialsCount: number;
    signatureAlgorithm: 'sigstore-cosign' | 'in-toto' | 'gpg';
}
```

#### <code v-pre>RateLimitDecision</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L16) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export interface RateLimitDecision {
    allowed: boolean;
    remaining: number;
    resetAtMs: number;
    reason: string;
}
```

#### <code v-pre>RateLimitStrategy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L14) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export type RateLimitStrategy = 'token-bucket' | 'leaky-bucket' | 'sliding-window';
```

#### <code v-pre>RbacPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L25) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface RbacPolicy {
    roles: Map<string, RbacRole>;
}
```

#### <code v-pre>RbacRole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L13) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface RbacRole {
    name: string;
    permissions: string[];
    /** parent roles — permissions を継承する上位 role 名。 */
    parents?: string[];
}
```

#### <code v-pre>RbacSubject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/authorization.ts#L20) <code v-pre>packages/security/src/authorization.ts</code>

```ts
export interface RbacSubject {
    id: string;
    roles: string[];
}
```

#### <code v-pre>RealDriverEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L79) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export interface RealDriverEndpoint {
    provider: SecurityProvider;
    endpoint: string | null;
    apiKey: string | null;
}
```

#### <code v-pre>RealDriverGateInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L20) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export interface RealDriverGateInput {
    provider: SecurityProvider;
    env?: NodeJS.ProcessEnv;
}
```

#### <code v-pre>RealDriverGateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/real-driver.ts#L25) <code v-pre>packages/security/src/real-driver.ts</code>

```ts
export interface RealDriverGateResult {
    useRealDriver: boolean;
    missingKeys: string[];
    reason: string;
}
```

#### <code v-pre>ReferrerPolicyValue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L25) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export type ReferrerPolicyValue = 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
```

#### <code v-pre>ReproducibleInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L44) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export interface ReproducibleInput {
    buildA_hash: string;
    buildB_hash: string;
    toolchainVersion: string;
}
```

#### <code v-pre>RetentionPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L45) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export interface RetentionPolicy {
    hotDays: number;
    warmDays: number;
    coldDays: number;
    legalHold: boolean;
}
```

#### <code v-pre>RotationPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L142) <code v-pre>packages/security/src/secrets-scan.ts</code>

Rotation policy — secret 発見時の rotation SLA + tracking。

```ts
export interface RotationPolicy {
    /** 発見から X 日以内に rotation 必須。 */
    rotateWithinDays: number;
    /** 対象 kind (未指定 = 全 kind)。 */
    appliesTo?: SecretKind[];
}
```

#### <code v-pre>RotationTracker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L149) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export interface RotationTracker {
    finding: SecretFinding;
    discoveredAtMs: number;
    rotatedAtMs: number | null;
    policy: RotationPolicy;
}
```

#### <code v-pre>SbomComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L13) <code v-pre>packages/security/src/sbom.ts</code>

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

#### <code v-pre>SbomDocument</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/sbom.ts#L22) <code v-pre>packages/security/src/sbom.ts</code>

```ts
export interface SbomDocument {
    format: 'cyclonedx' | 'spdx';
    formatVersion: string;
    components: SbomComponent[];
    generatedAtIso: string;
}
```

#### <code v-pre>SecretFinding</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L82) <code v-pre>packages/security/src/secrets-scan.ts</code>

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

#### <code v-pre>SecretKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L13) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export type SecretKind = 'aws-access-key' | 'aws-secret-key' | 'github-token' | 'slack-token' | 'openai-key' | 'stripe-key' | 'generic-jwt' | 'generic-private-key';
```

#### <code v-pre>SecretSignature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/secrets-scan.ts#L23) <code v-pre>packages/security/src/secrets-scan.ts</code>

```ts
export interface SecretSignature {
    kind: SecretKind;
    pattern: RegExp;
    minEntropy?: number;
    description: string;
}
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

#### <code v-pre>SecurityAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L19) <code v-pre>packages/security/src/types.ts</code>

8 axis の識別子。 SSOT なので追加変更は quality-metrics `SECURITY_AXES` と同期する必要がある。

```ts
export type SecurityAxis = 'csp' | 'rate-limit' | 'authorization' | 'waf' | 'threat-model' | 'secrets-scan' | 'sbom' | 'security-headers';
```

#### <code v-pre>SecurityDriver</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L67) <code v-pre>packages/security/src/types.ts</code>

driver 共通契約 — real / mock 両方に同じ shape で実装される。 fidelity harness が同一 scenario を real と mock に投げて event 列を照合する。

```ts
export interface SecurityDriver {
    readonly provider: SecurityProvider;
    readonly axis: SecurityAxis;
    runScenario(scenarioId: string): Promise<SecurityEvent[]>;
    reset(): void;
}
```

#### <code v-pre>SecurityEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L53) <code v-pre>packages/security/src/types.ts</code>

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

#### <code v-pre>SecurityFidelityInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L18) <code v-pre>packages/security/src/fidelity.ts</code>

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

#### <code v-pre>SecurityFidelityRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L27) <code v-pre>packages/security/src/fidelity.ts</code>

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

#### <code v-pre>SecurityFidelityReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/fidelity.ts#L43) <code v-pre>packages/security/src/fidelity.ts</code>

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

#### <code v-pre>SecurityHeadersInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L65) <code v-pre>packages/security/src/security-headers.ts</code>

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

#### <code v-pre>SecurityHeadersOutput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L74) <code v-pre>packages/security/src/security-headers.ts</code>

```ts
export interface SecurityHeadersOutput {
    headers: Record<string, string>;
}
```

#### <code v-pre>SecurityProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L33) <code v-pre>packages/security/src/types.ts</code>

4 provider の識別子。 v0.1 でカバーする provider adapter は 4 種類固定 (fidelity harness の 32 grid 前提)。

```ts
export type SecurityProvider = 'helmet' | 'express-rate-limit' | 'casbin' | 'coraza';
```

#### <code v-pre>SecurityVerdict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/types.ts#L47) <code v-pre>packages/security/src/types.ts</code>

8 axis 全部の判定 verdict の共通契約。

```ts
export type SecurityVerdict = 'allow' | 'deny' | 'warn';
```

#### <code v-pre>SegmentPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L47) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

```ts
export interface SegmentPolicy {
    workload: string;
    allowedPeers: string[];
    requestedPeer: string;
}
```

#### <code v-pre>SeverityInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/incident-response.ts#L42) <code v-pre>packages/security/src/semantics/incident-response.ts</code>

```ts
export interface SeverityInput {
    affectedUsers: number;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    serviceDown: boolean;
}
```

#### <code v-pre>SiemAuditSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L36) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

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

#### <code v-pre>SiemAuditState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L16) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

SIEM / audit log axis — structured logging + tamper-evident sealing + retention policy + correlation rule state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では Splunk / Elastic SIEM に HEC endpoint 経由で event を送信する。

```ts
export type SiemAuditState = 'idle' | 'structured' | 'sealed' | 'retention-tagged' | 'correlated';
```

#### <code v-pre>SiemEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L23) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export interface SiemEvent {
    actor: string;
    action: string;
    target: string;
    timestamp: number;
    result: 'success' | 'failure';
}
```

#### <code v-pre>SlidingWindowConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L135) <code v-pre>packages/security/src/rate-limit.ts</code>

Sliding window — time window の request timestamp 全部を記録し、 過去 windowMs 内の count で判定する経路。

```ts
export interface SlidingWindowConfig {
    windowMs: number;
    maxRequests: number;
}
```

#### <code v-pre>SlsaLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L16) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

Supply chain security axis — SLSA level verification + reproducible build matching + signed provenance + SLSA attestation verification state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では in-toto / sigstore に対して attestation 検証を発火する。

```ts
export type SlsaLevel = 0 | 1 | 2 | 3 | 4;
```

#### <code v-pre>SlsaLevelInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L33) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

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

#### <code v-pre>SriInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L32) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface SriInput {
    resourceUrl: string;
    integrity: string;
    computedHash: string;
}
```

#### <code v-pre>StrideCategory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L13) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export type StrideCategory = 'spoofing' | 'tampering' | 'repudiation' | 'information-disclosure' | 'denial-of-service' | 'elevation-of-privilege';
```

#### <code v-pre>StrideThreat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L21) <code v-pre>packages/security/src/threat-model.ts</code>

```ts
export interface StrideThreat {
    id: string;
    category: StrideCategory;
    description: string;
    /** 1-5 severity。 */
    severity: 1 | 2 | 3 | 4 | 5;
}
```

#### <code v-pre>StructuredEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/siem-audit.ts#L31) <code v-pre>packages/security/src/semantics/siem-audit.ts</code>

```ts
export interface StructuredEvent extends SiemEvent {
    eventId: string;
    cimSchemaVersion: string;
}
```

#### <code v-pre>SupplyChainSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L25) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export interface SupplyChainSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: SupplyChainState;
    history: AxisAdvStep<SupplyChainState>[];
    verifiedLevel: SlsaLevel;
}
```

#### <code v-pre>SupplyChainState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/supply-chain.ts#L18) <code v-pre>packages/security/src/semantics/supply-chain.ts</code>

```ts
export type SupplyChainState = 'idle' | 'slsa-verified' | 'reproducible-matched' | 'provenance-signed' | 'attestation-verified';
```

#### <code v-pre>TokenBucketConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L24) <code v-pre>packages/security/src/rate-limit.ts</code>

Token bucket — burst 対応 (max capacity まで貯蓄可)、 constant refill 経路。

```ts
export interface TokenBucketConfig {
    capacity: number;
    /** ms あたりの refill 量 (float 可、 内部で fraction accumulator)。 */
    refillPerMs: number;
}
```

#### <code v-pre>TrustedTypesInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L38) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface TrustedTypesInput {
    policyNames: string[];
    requireForScript: boolean;
    reportOnly: boolean;
}
```

#### <code v-pre>TrustZone</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/threat-model.ts#L141) <code v-pre>packages/security/src/threat-model.ts</code>

Trust boundary — DFD-style zone crossing modeler。 subject と resource が異なる trust zone を跨ぐ dataflow は mitigation (authn / authz / encryption) を必ず要求する。

```ts
export interface TrustZone {
    id: string;
    label: string;
    /** 0=untrusted / 1=partially / 2=trusted。 */
    level: 0 | 1 | 2;
}
```

#### <code v-pre>WafDecision</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L38) <code v-pre>packages/security/src/waf.ts</code>

```ts
export interface WafDecision {
    action: WafRuleAction;
    matchedRuleId: string | null;
    matchedCategory: string | null;
    reason: string;
}
```

#### <code v-pre>WafPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L81) <code v-pre>packages/security/src/waf.ts</code>

```ts
export interface WafPolicy {
    rules: WafRule[];
}
```

#### <code v-pre>WafRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L14) <code v-pre>packages/security/src/waf.ts</code>

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

#### <code v-pre>WafRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L25) <code v-pre>packages/security/src/waf.ts</code>

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

#### <code v-pre>WafRuleAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/waf.ts#L23) <code v-pre>packages/security/src/waf.ts</code>

```ts
export type WafRuleAction = 'block' | 'warn' | 'allow';
```

#### <code v-pre>WvsSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L25) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

```ts
export interface WvsSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: WvsState;
    history: AxisAdvStep<WvsState>[];
}
```

#### <code v-pre>WvsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/web-vitals-security.ts#L17) <code v-pre>packages/security/src/semantics/web-vitals-security.ts</code>

Web Vitals security axis — Subresource Integrity (SRI) hash + Trusted Types + Permissions Policy + Cross-Origin Isolation (COOP/COEP) enforcement state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では headless browser (Playwright) に対して response header を発火する。

```ts
export type WvsState = 'idle' | 'sri-verified' | 'trusted-types-enforced' | 'permissions-policy-applied' | 'cross-origin-isolated' | 'failed';
```

#### <code v-pre>XFrameOption</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/security-headers.ts#L20) <code v-pre>packages/security/src/security-headers.ts</code>

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

#### <code v-pre>ZeroTrustSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L25) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

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

#### <code v-pre>ZeroTrustState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/zero-trust.ts#L17) <code v-pre>packages/security/src/semantics/zero-trust.ts</code>

Zero-trust axis — device posture + risk scoring + Just-in-Time access + micro-segmentation state machine。 Deterministic mock で 4 signal 系統を提供。 real driver 経路では OPA rego policy や Google BeyondCorp 相当の verifier に対して posture 判定を 発火する。

```ts
export type ZeroTrustState = 'idle' | 'posture-evaluated' | 'risk-scored' | 'jit-granted' | 'jit-denied' | 'segment-enforced';
```
<!-- kiwa-public-api:end -->
