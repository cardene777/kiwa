import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Crypto payment axis — stablecoin invoicing + on-chain confirmation +
 * gas abstraction + wallet linking. Real crypto payment gateways
 * (Coinbase Commerce / BitPay / MoonPay) accept USDC / USDT / ETH,
 * poll the underlying chain for confirmations, absorb gas via meta-tx
 * / paymaster (EIP-4337) so end users pay a stablecoin price, and link
 * wallets to a customer id for repeat billing.
 */
export type CryptoPaymentState =
  | 'initial'
  | 'invoice-created'
  | 'awaiting-confirmation'
  | 'confirmed'
  | 'gas-abstracted'
  | 'wallet-linked'
  | 'expired'
  | 'failed';

export type Chain = 'ethereum' | 'polygon' | 'base' | 'arbitrum' | 'solana';
export type Stablecoin = 'USDC' | 'USDT' | 'DAI' | 'ETH' | 'SOL';

export interface CryptoInvoiceConfig {
  /** required confirmation count before marking as confirmed */
  requiredConfirmations?: number;
  /** ms after which the invoice expires if not confirmed */
  expirationMs?: number;
  /** whether gas abstraction (paymaster) is enabled */
  gasAbstractionEnabled?: boolean;
}

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

const CRYPTO_DEFAULTS: Required<CryptoInvoiceConfig> = {
  requiredConfirmations: 3,
  expirationMs: 15 * 60 * 1000, // 15 minutes
  gasAbstractionEnabled: true,
};

/**
 * Create a crypto invoice for the given amount + chain + token.
 */
export async function createCryptoInvoice(
  adapter: PaymentAdapter,
  input: {
    invoiceId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    chain: Chain;
    token: Stablecoin;
    config?: CryptoInvoiceConfig;
  },
): Promise<{ session: CryptoPaymentSession; step: AxisStep<CryptoPaymentState> }> {
  if (input.amountCents <= 0) {
    throw new Error('createCryptoInvoice: amountCents must be positive');
  }
  const config: Required<CryptoInvoiceConfig> = {
    ...CRYPTO_DEFAULTS,
    ...(input.config ?? {}),
  };
  const session: CryptoPaymentSession = {
    invoiceId: input.invoiceId,
    customerId: input.customerId,
    amountCents: input.amountCents,
    chain: input.chain,
    token: input.token,
    walletAddress: null,
    txHash: null,
    confirmations: 0,
    state: 'invoice-created',
    config,
    createdAt: Date.now(),
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  const step = await emit(adapter, session, 'crypto.invoice_created', {
    invoiceId: session.invoiceId,
    chain: session.chain,
    token: session.token,
  });
  return { session, step };
}

/**
 * Record an on-chain confirmation. Emits `crypto.tx_confirmed` once the
 * required confirmation count is reached.
 */
export async function confirmTx(
  adapter: PaymentAdapter,
  session: CryptoPaymentSession,
  input: { txHash: string; confirmations: number },
): Promise<AxisStep<CryptoPaymentState>> {
  if (session.state === 'expired' || session.state === 'failed') {
    throw new Error(`confirmTx: session is ${session.state}`);
  }
  const elapsed = Date.now() - session.createdAt;
  if (elapsed > session.config.expirationMs) {
    session.state = 'expired';
    throw new Error('confirmTx: invoice expired');
  }
  session.txHash = input.txHash;
  session.confirmations = input.confirmations;
  if (input.confirmations >= session.config.requiredConfirmations) {
    session.state = 'confirmed';
  } else {
    session.state = 'awaiting-confirmation';
  }
  return emit(adapter, session, 'crypto.tx_confirmed', {
    txHash: input.txHash,
    confirmations: input.confirmations,
    required: session.config.requiredConfirmations,
  });
}

/**
 * Abstract gas via paymaster (EIP-4337 or similar meta-tx). Customer pays
 * in the invoice token; the paymaster covers the native gas token.
 */
export async function abstractGas(
  adapter: PaymentAdapter,
  session: CryptoPaymentSession,
  input: { paymasterAddress: string; gasSubsidyCents: number },
): Promise<AxisStep<CryptoPaymentState>> {
  if (!session.config.gasAbstractionEnabled) {
    throw new Error('abstractGas: gas abstraction disabled in config');
  }
  if (input.gasSubsidyCents < 0) {
    throw new Error('abstractGas: gasSubsidyCents must be non-negative');
  }
  session.state = 'gas-abstracted';
  return emit(adapter, session, 'crypto.gas_abstracted', {
    paymasterAddress: input.paymasterAddress,
    gasSubsidyCents: input.gasSubsidyCents,
  });
}

/**
 * Link a wallet address to the customer id for repeat billing.
 */
export async function linkWallet(
  adapter: PaymentAdapter,
  session: CryptoPaymentSession,
  input: { walletAddress: string; signature: string },
): Promise<AxisStep<CryptoPaymentState>> {
  if (input.walletAddress.length === 0) {
    throw new Error('linkWallet: walletAddress must not be empty');
  }
  if (input.signature.length === 0) {
    throw new Error('linkWallet: signature required for wallet linkage');
  }
  session.walletAddress = input.walletAddress;
  session.state = 'wallet-linked';
  return emit(adapter, session, 'crypto.wallet_linked', {
    walletAddress: input.walletAddress,
    signatureLength: input.signature.length,
  });
}

async function emit(
  adapter: PaymentAdapter,
  session: CryptoPaymentSession,
  neutral:
    | 'crypto.invoice_created'
    | 'crypto.tx_confirmed'
    | 'crypto.gas_abstracted'
    | 'crypto.wallet_linked',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<CryptoPaymentState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: session.amountCents,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<CryptoPaymentState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: session.amountCents,
    metadata: {
      invoiceId: session.invoiceId,
      chain: session.chain,
      token: session.token,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
