---
title: "@kiwa-lab/payment semantics__crypto-payment の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;crypto-payment</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>abstractGas</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L136) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Abstract gas via paymaster (EIP-4337 or similar meta-tx). Customer pays in the invoice token; the paymaster covers the native gas token.

```ts
export declare function abstractGas(adapter: PaymentAdapter, session: CryptoPaymentSession, input: {
    paymasterAddress: string;
    gasSubsidyCents: number;
}): Promise<AxisStep<CryptoPaymentState>>;
```

#### <code v-pre>confirmTx</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L105) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Record an on-chain confirmation. Emits `crypto.tx_confirmed` once the required confirmation count is reached.

```ts
export declare function confirmTx(adapter: PaymentAdapter, session: CryptoPaymentSession, input: {
    txHash: string;
    confirmations: number;
}): Promise<AxisStep<CryptoPaymentState>>;
```

#### <code v-pre>createCryptoInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L59) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Create a crypto invoice for the given amount + chain + token.

```ts
export declare function createCryptoInvoice(adapter: PaymentAdapter, input: {
    invoiceId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    chain: Chain;
    token: Stablecoin;
    config?: CryptoInvoiceConfig;
}): Promise<{
    session: CryptoPaymentSession;
    step: AxisStep<CryptoPaymentState>;
}>;
```

#### <code v-pre>linkWallet</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L157) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Link a wallet address to the customer id for repeat billing.

```ts
export declare function linkWallet(adapter: PaymentAdapter, session: CryptoPaymentSession, input: {
    walletAddress: string;
    signature: string;
}): Promise<AxisStep<CryptoPaymentState>>;
```

### 型

#### <code v-pre>Chain</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L22) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

```ts
export type Chain = 'ethereum' | 'polygon' | 'base' | 'arbitrum' | 'solana';
```

#### <code v-pre>CryptoInvoiceConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L25) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

```ts
export interface CryptoInvoiceConfig {
    /** required confirmation count before marking as confirmed */
    requiredConfirmations?: number;
    /** ms after which the invoice expires if not confirmed */
    expirationMs?: number;
    /** whether gas abstraction (paymaster) is enabled */
    gasAbstractionEnabled?: boolean;
}
```

#### <code v-pre>CryptoPaymentSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L34) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

```ts
export interface CryptoPaymentSession {
    invoiceId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    chain: Chain;
    token: Stablecoin;
    walletAddress: string | null;
    txHash: string | null;
    confirmations: number;
    state: CryptoPaymentState;
    config: Required<CryptoInvoiceConfig>;
    createdAt: number;
    history: AxisStep<CryptoPaymentState>[];
}
```

#### <code v-pre>CryptoPaymentState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L12) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

Crypto payment axis — stablecoin invoicing + on-chain confirmation + gas abstraction + wallet linking. Real crypto payment gateways (Coinbase Commerce / BitPay / MoonPay) accept USDC / USDT / ETH, poll the underlying chain for confirmations, absorb gas via meta-tx / paymaster (EIP-4337) so end users pay a stablecoin price, and link wallets to a customer id for repeat billing.

```ts
export type CryptoPaymentState = 'initial' | 'invoice-created' | 'awaiting-confirmation' | 'confirmed' | 'gas-abstracted' | 'wallet-linked' | 'expired' | 'failed';
```

#### <code v-pre>Stablecoin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/crypto-payment.ts#L23) <code v-pre>packages/payment/src/semantics/crypto-payment.ts</code>

```ts
export type Stablecoin = 'USDC' | 'USDT' | 'DAI' | 'ETH' | 'SOL';
```
