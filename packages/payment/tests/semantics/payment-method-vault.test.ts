import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  migrateToken,
  revokeToken,
  startVault,
  tokenizeCard,
  verifyPciScope,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('payment-method-vault axis — 3 provider', () => {
  it.each(providers)('$name: tokenize + revoke lifecycle', async ({ make }) => {
    const adapter = make();
    const session = startVault({ customerId: 'cus_1' });
    const tokenStep = await tokenizeCard(adapter, session, {
      tokenId: 'tok_1',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp_1',
    });
    expect(tokenStep.neutralEvent).toBe('vault.token_created');
    expect(session.state).toBe('tokenized');
    expect(session.tokens.size).toBe(1);
    const revokeStep = await revokeToken(adapter, session, { tokenId: 'tok_1' });
    expect(revokeStep.neutralEvent).toBe('vault.token_revoked');
    expect(session.tokens.size).toBe(0);
    expect(session.state).toBe('revoked');
  });

  it('tokenizeCard rejects duplicate token id', async () => {
    const adapter = createStripeMock();
    const session = startVault({ customerId: 'cus_2' });
    await tokenizeCard(adapter, session, {
      tokenId: 'tok_dupe',
      last4: '0001',
      brand: 'mastercard',
      expMonth: 1,
      expYear: 2028,
      fingerprint: 'fp_a',
    });
    await expect(
      tokenizeCard(adapter, session, {
        tokenId: 'tok_dupe',
        last4: '0002',
        brand: 'visa',
        expMonth: 2,
        expYear: 2029,
        fingerprint: 'fp_b',
      }),
    ).rejects.toThrow(/already exists/);
  });

  it('revokeToken rejects unknown token id', async () => {
    const adapter = createPaddleMock();
    const session = startVault({ customerId: 'cus_3' });
    await expect(revokeToken(adapter, session, { tokenId: 'not_there' })).rejects.toThrow(
      /not found/,
    );
  });

  it('migrateToken transfers token from stripe to paddle', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startVault({ customerId: 'cus_4' });
    await tokenizeCard(stripe, session, {
      tokenId: 'tok_stripe',
      last4: '5555',
      brand: 'visa',
      expMonth: 6,
      expYear: 2027,
      fingerprint: 'fp_shared',
    });
    const step = await migrateToken(stripe, paddle, session, {
      tokenId: 'tok_stripe',
      newTokenId: 'tok_paddle',
    });
    expect(step.neutralEvent).toBe('vault.migrated');
    expect(step.metadata.fromProvider).toBe('stripe');
    expect(step.metadata.toProvider).toBe('paddle');
    expect(session.tokens.has('tok_stripe')).toBe(false);
    expect(session.tokens.has('tok_paddle')).toBe(true);
    expect(session.tokens.get('tok_paddle')?.provider).toBe('paddle');
  });

  it('migrateToken rejects when source belongs to different provider', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startVault({ customerId: 'cus_5' });
    await tokenizeCard(stripe, session, {
      tokenId: 'tok_stripe_2',
      last4: '0000',
      brand: 'amex',
      expMonth: 3,
      expYear: 2029,
      fingerprint: 'fp_x',
    });
    await expect(
      migrateToken(paddle, stripe, session, {
        tokenId: 'tok_stripe_2',
        newTokenId: 'tok_new',
      }),
    ).rejects.toThrow(/belongs to stripe/);
  });

  it('verifyPciScope succeeds when no PAN/CVV present', async () => {
    const adapter = createLemonSqueezyMock();
    const session = startVault({ customerId: 'cus_6' });
    await tokenizeCard(adapter, session, {
      tokenId: 'tok_pci',
      last4: '1234',
      brand: 'discover',
      expMonth: 8,
      expYear: 2028,
      fingerprint: 'fp_y',
    });
    const step = await verifyPciScope(adapter, session, { targetScope: 'SAQ-A' });
    expect(step.neutralEvent).toBe('vault.pci_scope_verified');
    expect(session.pciScope).toBe('SAQ-A');
    expect(session.state).toBe('pci-verified');
  });

  it('vault starts empty', () => {
    const session = startVault({ customerId: 'cus_7' });
    expect(session.state).toBe('empty');
    expect(session.tokens.size).toBe(0);
  });

  it('multiple tokens can coexist', async () => {
    const adapter = createStripeMock();
    const session = startVault({ customerId: 'cus_8' });
    await tokenizeCard(adapter, session, {
      tokenId: 'tok_a',
      last4: '1111',
      brand: 'visa',
      expMonth: 1,
      expYear: 2028,
      fingerprint: 'fp_a',
    });
    await tokenizeCard(adapter, session, {
      tokenId: 'tok_b',
      last4: '2222',
      brand: 'mastercard',
      expMonth: 2,
      expYear: 2029,
      fingerprint: 'fp_b',
    });
    expect(session.tokens.size).toBe(2);
  });
});
