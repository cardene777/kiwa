import { describe, expect, it } from 'vitest';
import {
  createPaddleMock,
  createStripeMock,
  migrateToken,
  providerEventName,
  revokeToken,
  startVault,
  tokenizeCard,
  verifyPciScope,
} from '../../src/index.js';

describe('Vault axis — defensive branch closure', () => {
  it('startVault stores currency when provided', () => {
    const session = startVault({ customerId: 'cus', currency: 'USD' });
    expect(session.currency).toBe('USD');
    expect(session.pciScope).toBe('unknown');
    expect(session.tokens.size).toBe(0);
    expect(session.state).toBe('empty');
  });

  it('startVault leaves currency undefined when omitted', () => {
    const session = startVault({ customerId: 'cus' });
    expect(session.currency).toBeUndefined();
  });

  it('tokenizeCard throws when tokenId already exists', async () => {
    const adapter = createStripeMock();
    const session = startVault({ customerId: 'cus' });
    await tokenizeCard(adapter, session, {
      tokenId: 't_dup',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp1',
    });
    await expect(
      tokenizeCard(adapter, session, {
        tokenId: 't_dup',
        last4: '0000',
        brand: 'mastercard',
        expMonth: 1,
        expYear: 2031,
        fingerprint: 'fp2',
      }),
    ).rejects.toThrow(/already exists/);
  });

  it('tokenizeCard with currency propagates currency in emit', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string }> = [];
    adapter.onWebhook((e) => { received.push({ type: e.type, currency: e.currency }); });
    const session = startVault({ customerId: 'cus', currency: 'JPY' });
    await tokenizeCard(adapter, session, {
      tokenId: 't1',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp1',
    });
    expect(received[0]?.currency).toBe('JPY');
  });

  it('revokeToken throws when token not found', async () => {
    const adapter = createStripeMock();
    const session = startVault({ customerId: 'cus' });
    await expect(
      revokeToken(adapter, session, { tokenId: 't_missing' }),
    ).rejects.toThrow(/not found/);
  });

  it('revokeToken decrements token count and reports remaining', async () => {
    const adapter = createStripeMock();
    const session = startVault({ customerId: 'cus' });
    await tokenizeCard(adapter, session, {
      tokenId: 'a',
      last4: '4242',
      brand: 'visa',
      expMonth: 1,
      expYear: 2030,
      fingerprint: 'fp_a',
    });
    await tokenizeCard(adapter, session, {
      tokenId: 'b',
      last4: '4343',
      brand: 'visa',
      expMonth: 1,
      expYear: 2030,
      fingerprint: 'fp_b',
    });
    const step = await revokeToken(adapter, session, { tokenId: 'a' });
    expect(session.tokens.has('a')).toBe(false);
    expect(session.tokens.has('b')).toBe(true);
    expect(step.metadata.remainingTokens).toBe(1);
  });

  it('migrateToken throws when source token not found', async () => {
    const from = createStripeMock();
    const to = createPaddleMock();
    const session = startVault({ customerId: 'cus' });
    await expect(
      migrateToken(from, to, session, { tokenId: 'missing', newTokenId: 'new' }),
    ).rejects.toThrow(/source token missing not found/);
  });

  it('migrateToken throws when source token provider mismatches fromAdapter', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startVault({ customerId: 'cus' });
    await tokenizeCard(stripe, session, {
      tokenId: 't_stripe',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp_x',
    });
    await expect(
      migrateToken(paddle, stripe, session, { tokenId: 't_stripe', newTokenId: 't_new' }),
    ).rejects.toThrow(/belongs to stripe, not paddle/);
  });

  it('migrateToken preserves fingerprint across providers', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startVault({ customerId: 'cus' });
    await tokenizeCard(stripe, session, {
      tokenId: 't_src',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp_shared',
    });
    const step = await migrateToken(stripe, paddle, session, {
      tokenId: 't_src',
      newTokenId: 't_dst',
    });
    expect(session.tokens.has('t_src')).toBe(false);
    const migrated = session.tokens.get('t_dst');
    expect(migrated?.provider).toBe('paddle');
    expect(migrated?.fingerprint).toBe('fp_shared');
    expect(step.metadata.fingerprint).toBe('fp_shared');
    expect(step.metadata.fromProvider).toBe('stripe');
    expect(step.metadata.toProvider).toBe('paddle');
  });

  it('migrateToken with vault currency propagates currency in emit', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const received: Array<{ type: string; currency?: string }> = [];
    paddle.onWebhook((e) => { received.push({ type: e.type, currency: e.currency }); });
    const session = startVault({ customerId: 'cus', currency: 'EUR' });
    await tokenizeCard(stripe, session, {
      tokenId: 't_a',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp',
    });
    await migrateToken(stripe, paddle, session, { tokenId: 't_a', newTokenId: 't_b' });
    const migratedEvent = received.find(
      (r) => r.type === providerEventName(paddle.provider, 'vault.migrated'),
    );
    expect(migratedEvent?.currency).toBe('EUR');
  });

  it('verifyPciScope throws when raw PAN present on any token', async () => {
    const adapter = createStripeMock();
    const session = startVault({ customerId: 'cus' });
    await tokenizeCard(adapter, session, {
      tokenId: 'clean',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp',
    });
    const clean = session.tokens.get('clean');
    if (clean) {
      (clean as unknown as Record<string, string>).pan = '4242424242424242';
    }
    await expect(
      verifyPciScope(adapter, session, { targetScope: 'SAQ-A' }),
    ).rejects.toThrow(/raw PAN\/CVV detected/);
  });

  it('verifyPciScope throws when raw CVV present on any token', async () => {
    const adapter = createStripeMock();
    const session = startVault({ customerId: 'cus' });
    await tokenizeCard(adapter, session, {
      tokenId: 'clean',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp',
    });
    const clean = session.tokens.get('clean');
    if (clean) {
      (clean as unknown as Record<string, string>).cvv = '123';
    }
    await expect(
      verifyPciScope(adapter, session, { targetScope: 'SAQ-A' }),
    ).rejects.toThrow(/raw PAN\/CVV detected/);
  });

  it('verifyPciScope throws when raw cardNumber field present', async () => {
    const adapter = createStripeMock();
    const session = startVault({ customerId: 'cus' });
    await tokenizeCard(adapter, session, {
      tokenId: 'clean',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp',
    });
    const clean = session.tokens.get('clean');
    if (clean) {
      (clean as unknown as Record<string, string>).cardNumber = '4242';
    }
    await expect(
      verifyPciScope(adapter, session, { targetScope: 'SAQ-D' }),
    ).rejects.toThrow(/raw PAN\/CVV detected/);
  });

  it('verifyPciScope passes and sets scope when no raw data present', async () => {
    const adapter = createStripeMock();
    const session = startVault({ customerId: 'cus' });
    await tokenizeCard(adapter, session, {
      tokenId: 'clean',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp',
      networkTokenId: 'nt_1',
    });
    const step = await verifyPciScope(adapter, session, { targetScope: 'SAQ-A-EP' });
    expect(session.pciScope).toBe('SAQ-A-EP');
    expect(session.state).toBe('pci-verified');
    expect(step.metadata.scope).toBe('SAQ-A-EP');
    expect(step.metadata.tokenCount).toBe(1);
  });

  it('token migration history records step in vault history', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startVault({ customerId: 'cus' });
    await tokenizeCard(stripe, session, {
      tokenId: 't_src',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp',
    });
    await migrateToken(stripe, paddle, session, {
      tokenId: 't_src',
      newTokenId: 't_dst',
    });
    const migrationStep = session.history.find((h) => h.neutralEvent === 'vault.migrated');
    expect(migrationStep).toBeDefined();
    expect(migrationStep?.metadata.oldTokenId).toBe('t_src');
    expect(migrationStep?.metadata.newTokenId).toBe('t_dst');
  });
});
