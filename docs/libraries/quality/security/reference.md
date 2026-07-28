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

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/security/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [authorization.ts](./api/authorization) | 6 | 10 |
| [csp.ts](./api/csp) | 3 | 6 |
| [fidelity.ts](./api/fidelity) | 4 | 3 |
| [rate-limit.ts](./api/rate-limit) | 6 | 7 |
| [real-driver.ts](./api/real-driver) | 5 | 3 |
| [sbom.ts](./api/sbom) | 8 | 7 |
| [secrets-scan.ts](./api/secrets-scan) | 6 | 5 |
| [security-headers.ts](./api/security-headers) | 3 | 7 |
| [semantics/container-k8s.ts](./api/semantics__container-k8s) | 4 | 6 |
| [semantics/crypto-advanced.ts](./api/semantics__crypto-advanced) | 7 | 11 |
| [semantics/fidelity.ts](./api/semantics__fidelity) | 3 | 2 |
| [semantics/incident-response.ts](./api/semantics__incident-response) | 6 | 8 |
| [semantics/mtls.ts](./api/semantics__mtls) | 5 | 6 |
| [semantics/real-driver.ts](./api/semantics__real-driver) | 9 | 3 |
| [semantics/siem-audit.ts](./api/semantics__siem-audit) | 5 | 6 |
| [semantics/supply-chain.ts](./api/semantics__supply-chain) | 5 | 7 |
| [semantics/types.ts](./api/semantics__types) | 1 | 4 |
| [semantics/web-vitals-security.ts](./api/semantics__web-vitals-security) | 5 | 6 |
| [semantics/zero-trust.ts](./api/semantics__zero-trust) | 5 | 5 |
| [threat-model.ts](./api/threat-model) | 5 | 9 |
| [types.ts](./api/types) | 0 | 5 |
| [waf.ts](./api/waf) | 6 | 5 |

<!-- kiwa-public-api:end -->
