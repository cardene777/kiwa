/**
 * `/invoice` HTTP handler — crypto invoice creation + on-chain confirmation
 * + gas abstraction (paymaster / EIP-4337) + wallet link + status snapshot
 * ops the runtime exposes to the invoice surface. The route is
 * intentionally shape-neutral — the fidelity harness feeds plain objects
 * in and asserts on plain objects out, so the same test can exercise mock
 * and real without spinning up a Coinbase Commerce / BitPay / MoonPay
 * account.
 *
 * The invoice surface pairs the parent v1.41-1 `crypto-payment` axis
 * (createCryptoInvoice + confirmTx + abstractGas + linkWallet) with
 * `@kiwa-test/payment` v0.5 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type {
  CryptoChain,
  CryptoToken,
  PaymentAdapter,
} from '../../adapters/interface.js';

export type InvoiceOpKind =
  | 'create'
  | 'confirm'
  | 'gas'
  | 'wallet'
  | 'status';

const VALID_CHAINS: readonly CryptoChain[] = [
  'ethereum',
  'polygon',
  'base',
  'arbitrum',
  'solana',
];
const VALID_TOKENS: readonly CryptoToken[] = [
  'USDC',
  'USDT',
  'DAI',
  'ETH',
  'SOL',
];

export interface InvoiceRequest {
  kind: InvoiceOpKind;
  sessionId: string;
  invoiceId: string;
  // create
  customerId?: string;
  amountCents?: number;
  currency?: string;
  chain?: CryptoChain;
  token?: CryptoToken;
  requiredConfirmations?: number;
  expirationMs?: number;
  gasAbstractionEnabled?: boolean;
  // confirm
  txHash?: string;
  confirmations?: number;
  // gas
  paymasterAddress?: string;
  gasSubsidyCents?: number;
  // wallet
  walletAddress?: string;
  signature?: string;
}

export interface InvoiceResponse {
  ok: boolean;
  kind: InvoiceOpKind;
  sessionId: string;
  invoiceId: string;
  customerId?: string;
  amountCents?: number;
  currency?: string;
  chain?: string;
  token?: string;
  txHash?: string;
  confirmations?: number;
  requiredConfirmations?: number;
  paymasterAddress?: string;
  gasSubsidyCents?: number;
  walletAddress?: string | null;
  signatureLength?: number;
  state?: string;
  errorKind?: string;
}

export function validateInvoiceRequest(
  body: unknown,
): { ok: true; value: InvoiceRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (typeof b['invoiceId'] !== 'string' || !b['invoiceId']) {
    return { ok: false, errorKind: 'invoiceId_required' };
  }
  const kind = b['kind'];
  if (
    kind !== 'create' &&
    kind !== 'confirm' &&
    kind !== 'gas' &&
    kind !== 'wallet' &&
    kind !== 'status'
  ) {
    return {
      ok: false,
      errorKind: 'kind_must_be_create_confirm_gas_wallet_or_status',
    };
  }
  const value: InvoiceRequest = {
    kind,
    sessionId: b['sessionId'],
    invoiceId: b['invoiceId'],
  };
  if (kind === 'create') {
    if (typeof b['customerId'] !== 'string' || !b['customerId']) {
      return { ok: false, errorKind: 'customerId_required' };
    }
    if (typeof b['amountCents'] !== 'number') {
      return { ok: false, errorKind: 'amountCents_required_number' };
    }
    if (
      typeof b['chain'] !== 'string' ||
      !VALID_CHAINS.includes(b['chain'] as CryptoChain)
    ) {
      return { ok: false, errorKind: 'chain_must_be_valid' };
    }
    if (
      typeof b['token'] !== 'string' ||
      !VALID_TOKENS.includes(b['token'] as CryptoToken)
    ) {
      return { ok: false, errorKind: 'token_must_be_valid' };
    }
    value.customerId = b['customerId'];
    value.amountCents = b['amountCents'];
    value.chain = b['chain'] as CryptoChain;
    value.token = b['token'] as CryptoToken;
    if (typeof b['currency'] === 'string') value.currency = b['currency'];
    if (typeof b['requiredConfirmations'] === 'number') {
      value.requiredConfirmations = b['requiredConfirmations'];
    }
    if (typeof b['expirationMs'] === 'number') {
      value.expirationMs = b['expirationMs'];
    }
    if (typeof b['gasAbstractionEnabled'] === 'boolean') {
      value.gasAbstractionEnabled = b['gasAbstractionEnabled'];
    }
    return { ok: true, value };
  }
  if (kind === 'confirm') {
    if (typeof b['txHash'] !== 'string' || !b['txHash']) {
      return { ok: false, errorKind: 'txHash_required' };
    }
    if (typeof b['confirmations'] !== 'number') {
      return { ok: false, errorKind: 'confirmations_required_number' };
    }
    value.txHash = b['txHash'];
    value.confirmations = b['confirmations'];
    return { ok: true, value };
  }
  if (kind === 'gas') {
    if (typeof b['paymasterAddress'] !== 'string' || !b['paymasterAddress']) {
      return { ok: false, errorKind: 'paymasterAddress_required' };
    }
    if (typeof b['gasSubsidyCents'] !== 'number') {
      return { ok: false, errorKind: 'gasSubsidyCents_required_number' };
    }
    value.paymasterAddress = b['paymasterAddress'];
    value.gasSubsidyCents = b['gasSubsidyCents'];
    return { ok: true, value };
  }
  if (kind === 'wallet') {
    if (typeof b['walletAddress'] !== 'string' || !b['walletAddress']) {
      return { ok: false, errorKind: 'walletAddress_required' };
    }
    if (typeof b['signature'] !== 'string' || !b['signature']) {
      return { ok: false, errorKind: 'signature_required' };
    }
    value.walletAddress = b['walletAddress'];
    value.signature = b['signature'];
    return { ok: true, value };
  }
  // kind === 'status' — sessionId + invoiceId only.
  return { ok: true, value };
}

export async function handleInvoiceRequest(
  adapter: PaymentAdapter,
  req: InvoiceRequest,
): Promise<InvoiceResponse> {
  try {
    if (req.kind === 'create') {
      const createInput: Parameters<PaymentAdapter['createInvoice']>[0] = {
        sessionId: req.sessionId,
        invoiceId: req.invoiceId,
        customerId: req.customerId!,
        amountCents: req.amountCents!,
        chain: req.chain!,
        token: req.token!,
      };
      if (req.currency !== undefined) createInput.currency = req.currency;
      if (req.requiredConfirmations !== undefined) {
        createInput.requiredConfirmations = req.requiredConfirmations;
      }
      if (req.expirationMs !== undefined) {
        createInput.expirationMs = req.expirationMs;
      }
      if (req.gasAbstractionEnabled !== undefined) {
        createInput.gasAbstractionEnabled = req.gasAbstractionEnabled;
      }
      const result = await adapter.createInvoice(createInput);
      const response: InvoiceResponse = {
        ok: true,
        kind: 'create',
        sessionId: result.sessionId,
        invoiceId: result.invoiceId,
        customerId: result.customerId,
        amountCents: result.amountCents,
        chain: result.chain,
        token: result.token,
        state: result.state,
      };
      if (result.currency !== undefined) response.currency = result.currency;
      return response;
    }
    if (req.kind === 'confirm') {
      const result = await adapter.confirmTx({
        sessionId: req.sessionId,
        invoiceId: req.invoiceId,
        txHash: req.txHash!,
        confirmations: req.confirmations!,
      });
      return {
        ok: true,
        kind: 'confirm',
        sessionId: result.sessionId,
        invoiceId: result.invoiceId,
        txHash: result.txHash,
        confirmations: result.confirmations,
        requiredConfirmations: result.requiredConfirmations,
        state: result.state,
      };
    }
    if (req.kind === 'gas') {
      const result = await adapter.abstractGas({
        sessionId: req.sessionId,
        invoiceId: req.invoiceId,
        paymasterAddress: req.paymasterAddress!,
        gasSubsidyCents: req.gasSubsidyCents!,
      });
      return {
        ok: true,
        kind: 'gas',
        sessionId: result.sessionId,
        invoiceId: result.invoiceId,
        paymasterAddress: result.paymasterAddress,
        gasSubsidyCents: result.gasSubsidyCents,
        state: result.state,
      };
    }
    if (req.kind === 'wallet') {
      const result = await adapter.linkWallet({
        sessionId: req.sessionId,
        invoiceId: req.invoiceId,
        walletAddress: req.walletAddress!,
        signature: req.signature!,
      });
      return {
        ok: true,
        kind: 'wallet',
        sessionId: result.sessionId,
        invoiceId: result.invoiceId,
        walletAddress: result.walletAddress,
        signatureLength: result.signatureLength,
        state: result.state,
      };
    }
    // kind === 'status'
    const result = await adapter.checkInvoiceStatus({
      sessionId: req.sessionId,
      invoiceId: req.invoiceId,
    });
    const response: InvoiceResponse = {
      ok: true,
      kind: 'status',
      sessionId: result.sessionId,
      invoiceId: result.invoiceId,
      amountCents: result.amountCents,
      chain: result.chain,
      token: result.token,
      walletAddress: result.walletAddress,
      confirmations: result.confirmations,
      requiredConfirmations: result.requiredConfirmations,
      state: result.state,
    };
    if (result.txHash !== null) response.txHash = result.txHash;
    return response;
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      invoiceId: req.invoiceId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
