---
title: "@kiwa-lab/mobile semantics-secure-storage の API 契約"
---

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics-secure-storage</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>challengeBiometric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L71) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function challengeBiometric(session: SecureStorageSession, input: {
    method: 'face-id' | 'touch-id' | 'fingerprint' | 'webauthn';
    success: boolean;
}): AxisStep<SecureStorageState>;
```

#### <code v-pre>initSecureStorage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L37) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function initSecureStorage(input: {
    target: MobileTarget;
    vaultId: string;
}): SecureStorageSession;
```

#### <code v-pre>removeCredential</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L84) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function removeCredential(session: SecureStorageSession, key: string): AxisStep<SecureStorageState>;
```

#### <code v-pre>retrieveCredential</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L62) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function retrieveCredential(session: SecureStorageSession, key: string): AxisStep<SecureStorageState>;
```

#### <code v-pre>storeCredential</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L49) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export declare function storeCredential(session: SecureStorageSession, input: {
    key: string;
    encryptedValue: string;
    requireBiometric?: boolean;
}): AxisStep<SecureStorageState>;
```

### 型

#### <code v-pre>SecureStorageSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L9) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

```ts
export interface SecureStorageSession {
    target: MobileTarget;
    vaultId: string;
    state: SecureStorageState;
    credentials: Map<string, string>;
    biometricChallenges: number;
    history: AxisStep<SecureStorageState>[];
}
```

#### <code v-pre>SecureStorageState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/secure-storage.ts#L7) <code v-pre>packages/mobile/src/semantics/secure-storage.ts</code>

v1.51 secure-storage axis — iOS Keychain / Android Keystore / web CredMgmt API。 biometric challenge (Face ID / Touch ID / Fingerprint / WebAuthn) 込み。

```ts
export type SecureStorageState = 'idle' | 'stored' | 'retrieved' | 'biometric-challenged' | 'removed';
```
