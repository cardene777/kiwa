/**
 * Provider-neutral Payment Adapter surface for the crypto + FX cross-border
 * dogfood.
 *
 * The app talks to the invoice + fx surface only through this interface.
 * Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real Coinbase Commerce + BitPay +
 *    Wise + Airwallex style crypto-and-FX platform (KIWA_CHAIN_RPC +
 *    KIWA_FX_URL + KIWA_PAYMASTER_URL + KIWA_SETTLEMENT_URL) when
 *    `KIWA_MODE=real` + `CRYPTO_FX_STACK_READY=1` are set; otherwise every
 *    op reports `KIWA_CRYPTO_FX_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-lab/payment` v0.5
 *    crypto-payment + fx-cross-border semantics (createCryptoInvoice /
 *    confirmTx / abstractGas / linkWallet / startFxTransfer / lockRate /
 *    initiateSettlement / completeSettlement / expireRate).
 *
 * Both must satisfy the same 14-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 2 axes v1.41-4
 * dogfoods —
 *  - invoice (create crypto invoice + confirm on-chain tx + gas
 *    abstraction + wallet link + status snapshot + close)
 *  - fx (start FX transfer + rate lock + settlement initiation +
 *    settlement completion + rate expiration + status snapshot + close)
 *
 * The AC anchors this contract on the 2 domain surfaces the harness runs
 * against both adapters —
 *  - invoice-e2e (createInvoice + confirmTx + abstractGas + linkWallet +
 *    checkInvoiceStatus)
 *  - fx-e2e (lockRate + initiateSettlement + completeSettlement +
 *    expireRate + checkFxStatus)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Result of creating a crypto invoice. */
export interface InvoiceCreateResult {
  sessionId: string;
  invoiceId: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  chain: string;
  token: string;
  state: string;
  latencyMs: number;
}

/** Result of recording an on-chain confirmation on an invoice. */
export interface InvoiceConfirmResult {
  sessionId: string;
  invoiceId: string;
  txHash: string;
  confirmations: number;
  requiredConfirmations: number;
  state: string;
  latencyMs: number;
}

/** Result of abstracting gas via a paymaster (EIP-4337 or similar). */
export interface InvoiceAbstractGasResult {
  sessionId: string;
  invoiceId: string;
  paymasterAddress: string;
  gasSubsidyCents: number;
  state: string;
  latencyMs: number;
}

/** Result of linking a wallet address to the invoice customer. */
export interface InvoiceLinkWalletResult {
  sessionId: string;
  invoiceId: string;
  walletAddress: string;
  signatureLength: number;
  state: string;
  latencyMs: number;
}

/** Snapshot of the current status of a crypto invoice. */
export interface InvoiceStatusResult {
  sessionId: string;
  invoiceId: string;
  amountCents: number;
  chain: string;
  token: string;
  walletAddress: string | null;
  txHash: string | null;
  confirmations: number;
  requiredConfirmations: number;
  state: string;
  latencyMs: number;
}

/** Result of locking an FX rate quote. */
export interface FxLockRateResult {
  sessionId: string;
  transferId: string;
  quoteId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  amountFromCents: number;
  amountToCents: number;
  lockExpiresAt: number;
  state: string;
  latencyMs: number;
}

/** Result of initiating cross-border settlement (SWIFT/SEPA/ACH). */
export interface FxInitiateSettlementResult {
  sessionId: string;
  transferId: string;
  rail: string;
  quoteId: string;
  beneficiaryIban?: string;
  beneficiaryBic?: string;
  state: string;
  latencyMs: number;
}

/** Result of completing cross-border settlement — funds arrived. */
export interface FxCompleteSettlementResult {
  sessionId: string;
  transferId: string;
  settlementRef: string;
  settledAmountCents: number;
  rail: string;
  state: string;
  latencyMs: number;
}

/** Result of explicitly expiring a rate lock. */
export interface FxExpireRateResult {
  sessionId: string;
  transferId: string;
  quoteId: string;
  expiredAt: number;
  state: string;
  latencyMs: number;
}

/** Snapshot of the current FX transfer status. */
export interface FxStatusResult {
  sessionId: string;
  transferId: string;
  quoteId: string | null;
  rate: number | null;
  amountFromCents: number | null;
  amountToCents: number | null;
  settledAmountCents: number;
  rail: string;
  state: string;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startInvoice'
    | 'createInvoice'
    | 'confirmTx'
    | 'abstractGas'
    | 'linkWallet'
    | 'checkInvoiceStatus'
    | 'closeInvoice'
    | 'startFx'
    | 'lockRate'
    | 'initiateSettlement'
    | 'completeSettlement'
    | 'expireRate'
    | 'checkFxStatus'
    | 'closeFx';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

/** Input for opening a crypto invoice session. */
export interface InvoiceSessionInput {
  sessionId: string;
  provider: 'coinbase-commerce' | 'bitpay' | 'moonpay';
}

/** Input for opening an FX transfer session. */
export interface FxSessionInput {
  sessionId: string;
  provider: 'wise' | 'airwallex' | 'currencycloud';
}

export type CryptoChain =
  | 'ethereum'
  | 'polygon'
  | 'base'
  | 'arbitrum'
  | 'solana';
export type CryptoToken = 'USDC' | 'USDT' | 'DAI' | 'ETH' | 'SOL';
export type SettlementRail = 'SWIFT' | 'SEPA' | 'ACH' | 'FASTER' | 'RTGS';

/** The Payment Adapter — 14 ops across 2 domain surfaces + 2 axes. */
export interface PaymentAdapter {
  readonly mode: 'real' | 'mock';

  // invoice surface (invoice-e2e axis: create + confirm + gas + wallet + status)
  startInvoice(input: InvoiceSessionInput): Promise<void>;
  createInvoice(input: {
    sessionId: string;
    invoiceId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    chain: CryptoChain;
    token: CryptoToken;
    requiredConfirmations?: number;
    expirationMs?: number;
    gasAbstractionEnabled?: boolean;
  }): Promise<InvoiceCreateResult>;
  confirmTx(input: {
    sessionId: string;
    invoiceId: string;
    txHash: string;
    confirmations: number;
  }): Promise<InvoiceConfirmResult>;
  abstractGas(input: {
    sessionId: string;
    invoiceId: string;
    paymasterAddress: string;
    gasSubsidyCents: number;
  }): Promise<InvoiceAbstractGasResult>;
  linkWallet(input: {
    sessionId: string;
    invoiceId: string;
    walletAddress: string;
    signature: string;
  }): Promise<InvoiceLinkWalletResult>;
  checkInvoiceStatus(input: {
    sessionId: string;
    invoiceId: string;
  }): Promise<InvoiceStatusResult>;
  closeInvoice(input: { sessionId: string }): Promise<void>;

  // fx surface (fx-e2e axis: lock + initiate + complete + expire + status)
  startFx(input: FxSessionInput): Promise<void>;
  lockRate(input: {
    sessionId: string;
    transferId: string;
    customerId: string;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    quoteId: string;
    amountFromCents: number;
    rateLockDurationMs?: number;
    settlementRail?: SettlementRail;
  }): Promise<FxLockRateResult>;
  initiateSettlement(input: {
    sessionId: string;
    transferId: string;
    beneficiaryIban?: string;
    beneficiaryBic?: string;
  }): Promise<FxInitiateSettlementResult>;
  completeSettlement(input: {
    sessionId: string;
    transferId: string;
    settlementRef: string;
  }): Promise<FxCompleteSettlementResult>;
  expireRate(input: {
    sessionId: string;
    transferId: string;
  }): Promise<FxExpireRateResult>;
  checkFxStatus(input: {
    sessionId: string;
    transferId: string;
  }): Promise<FxStatusResult>;
  closeFx(input: { sessionId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
