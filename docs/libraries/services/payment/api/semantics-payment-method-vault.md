---
title: "@kiwa-lab/payment semantics-payment-method-vault の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-payment-method-vault</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>migrateToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L107) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Migrate a token from one provider to another. The source token must exist; the target adapter receives a new token id under its provider namespace with the same fingerprint / network-token linkage.

```ts
export declare function migrateToken(fromAdapter: PaymentAdapter, toAdapter: PaymentAdapter, session: VaultSession, input: {
    tokenId: string;
    newTokenId: string;
}): Promise<AxisStep<VaultState>>;
```

#### <code v-pre>revokeToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L85) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Revoke an existing token — customer removed the card or the fraud team blacklisted the fingerprint.

```ts
export declare function revokeToken(adapter: PaymentAdapter, session: VaultSession, input: {
    tokenId: string;
}): Promise<AxisStep<VaultState>>;
```

#### <code v-pre>startVault</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L41) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Start a fresh vault session for a customer.

```ts
export declare function startVault(input: {
    customerId: string;
    currency?: string;
}): VaultSession;
```

#### <code v-pre>tokenizeCard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L60) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Tokenize a card into the vault. Emits `vault.token_created` and moves the session to `tokenized`.

```ts
export declare function tokenizeCard(adapter: PaymentAdapter, session: VaultSession, input: Omit<VaultToken, 'provider'>): Promise<AxisStep<VaultState>>;
```

#### <code v-pre>verifyPciScope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L160) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Assert PCI DSS SAQ-A compliance — verifies that no raw PAN or CVV is present in any token in the vault. Real merchants run this as a compile-time / runtime gate before every deploy.

```ts
export declare function verifyPciScope(adapter: PaymentAdapter, session: VaultSession, input: {
    targetScope: 'SAQ-A' | 'SAQ-A-EP' | 'SAQ-D';
}): Promise<AxisStep<VaultState>>;
```

### 型

#### <code v-pre>VaultSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L29) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

```ts
export interface VaultSession {
    customerId: string;
    currency?: string;
    tokens: Map<string, VaultToken>;
    state: VaultState;
    pciScope: 'SAQ-A' | 'SAQ-A-EP' | 'SAQ-D' | 'unknown';
    history: AxisStep<VaultState>[];
}
```

#### <code v-pre>VaultState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L11) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

Payment method vault axis — tokenization + PCI DSS SAQ-A + cross-provider migration. Real merchants tokenize PAN + CVV so the raw card data never lands on their systems (SAQ-A / SAQ-A-EP compliance) and portable tokens (network tokens, PSP-agnostic tokens) let merchants migrate from Stripe to Paddle without asking customers to re-enter card details.

```ts
export type VaultState = 'empty' | 'tokenized' | 'revoked' | 'migrated' | 'pci-verified';
```

#### <code v-pre>VaultToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-method-vault.ts#L18) <code v-pre>packages/payment/src/semantics/payment-method-vault.ts</code>

```ts
export interface VaultToken {
    tokenId: string;
    provider: PaymentProvider;
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
    fingerprint: string;
    networkTokenId?: string;
}
```
