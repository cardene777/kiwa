import type { PaymentAdapter, PaymentProvider } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Payment method vault axis — tokenization + PCI DSS SAQ-A + cross-provider
 * migration. Real merchants tokenize PAN + CVV so the raw card data never
 * lands on their systems (SAQ-A / SAQ-A-EP compliance) and portable tokens
 * (network tokens, PSP-agnostic tokens) let merchants migrate from Stripe
 * to Paddle without asking customers to re-enter card details.
 */
export type VaultState =
  | 'empty'
  | 'tokenized'
  | 'revoked'
  | 'migrated'
  | 'pci-verified';

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

export interface VaultSession {
  customerId: string;
  currency?: string;
  tokens: Map<string, VaultToken>;
  state: VaultState;
  pciScope: 'SAQ-A' | 'SAQ-A-EP' | 'SAQ-D' | 'unknown';
  history: AxisStep<VaultState>[];
}

/**
 * Start a fresh vault session for a customer.
 */
export function startVault(input: {
  customerId: string;
  currency?: string;
}): VaultSession {
  const session: VaultSession = {
    customerId: input.customerId,
    tokens: new Map(),
    state: 'empty',
    pciScope: 'unknown',
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Tokenize a card into the vault. Emits `vault.token_created` and moves
 * the session to `tokenized`.
 */
export async function tokenizeCard(
  adapter: PaymentAdapter,
  session: VaultSession,
  input: Omit<VaultToken, 'provider'>,
): Promise<AxisStep<VaultState>> {
  if (session.tokens.has(input.tokenId)) {
    throw new Error(`tokenizeCard: token ${input.tokenId} already exists`);
  }
  const token: VaultToken = {
    ...input,
    provider: adapter.provider,
  };
  session.tokens.set(input.tokenId, token);
  session.state = 'tokenized';
  return emit(adapter, session, 'vault.token_created', {
    tokenId: input.tokenId,
    last4: input.last4,
    brand: input.brand,
  });
}

/**
 * Revoke an existing token — customer removed the card or the fraud team
 * blacklisted the fingerprint.
 */
export async function revokeToken(
  adapter: PaymentAdapter,
  session: VaultSession,
  input: { tokenId: string },
): Promise<AxisStep<VaultState>> {
  const token = session.tokens.get(input.tokenId);
  if (!token) {
    throw new Error(`revokeToken: token ${input.tokenId} not found`);
  }
  session.tokens.delete(input.tokenId);
  session.state = 'revoked';
  return emit(adapter, session, 'vault.token_revoked', {
    tokenId: input.tokenId,
    remainingTokens: session.tokens.size,
  });
}

/**
 * Migrate a token from one provider to another. The source token must
 * exist; the target adapter receives a new token id under its provider
 * namespace with the same fingerprint / network-token linkage.
 */
export async function migrateToken(
  fromAdapter: PaymentAdapter,
  toAdapter: PaymentAdapter,
  session: VaultSession,
  input: { tokenId: string; newTokenId: string },
): Promise<AxisStep<VaultState>> {
  const source = session.tokens.get(input.tokenId);
  if (!source) {
    throw new Error(`migrateToken: source token ${input.tokenId} not found`);
  }
  if (source.provider !== fromAdapter.provider) {
    throw new Error(
      `migrateToken: source token belongs to ${source.provider}, not ${fromAdapter.provider}`,
    );
  }
  const migrated: VaultToken = {
    ...source,
    tokenId: input.newTokenId,
    provider: toAdapter.provider,
  };
  session.tokens.set(input.newTokenId, migrated);
  session.tokens.delete(input.tokenId);
  session.state = 'migrated';
  const providerEvent = providerEventName(toAdapter.provider, 'vault.migrated');
  const { event } = toAdapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  const step: AxisStep<VaultState> = {
    neutralEvent: 'vault.migrated',
    providerEvent,
    state: session.state,
    amountCents: 0,
    metadata: {
      fromProvider: fromAdapter.provider,
      toProvider: toAdapter.provider,
      oldTokenId: input.tokenId,
      newTokenId: input.newTokenId,
      fingerprint: source.fingerprint,
    },
  };
  await toAdapter.emit(event);
  session.history.push(step);
  return step;
}

/**
 * Assert PCI DSS SAQ-A compliance — verifies that no raw PAN or CVV is
 * present in any token in the vault. Real merchants run this as a
 * compile-time / runtime gate before every deploy.
 */
export async function verifyPciScope(
  adapter: PaymentAdapter,
  session: VaultSession,
  input: { targetScope: 'SAQ-A' | 'SAQ-A-EP' | 'SAQ-D' },
): Promise<AxisStep<VaultState>> {
  const violation = [...session.tokens.values()].some(
    (t) =>
      Object.keys(t).some(
        (k) => k === 'pan' || k === 'cvv' || k === 'cardNumber',
      ),
  );
  if (violation) {
    throw new Error('verifyPciScope: raw PAN/CVV detected in vault');
  }
  session.pciScope = input.targetScope;
  session.state = 'pci-verified';
  return emit(adapter, session, 'vault.pci_scope_verified', {
    scope: input.targetScope,
    tokenCount: session.tokens.size,
  });
}

async function emit(
  adapter: PaymentAdapter,
  session: VaultSession,
  neutral:
    | 'vault.token_created'
    | 'vault.token_revoked'
    | 'vault.pci_scope_verified',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<VaultState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<VaultState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: 0,
    metadata: {
      customerId: session.customerId,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
