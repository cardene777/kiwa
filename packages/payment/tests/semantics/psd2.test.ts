import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createMandate,
  createPaddleMock,
  createStripeMock,
  grantConsent,
  revokeMandate,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('PSD2 axis — 3 provider', () => {
  it.each(providers)('$name: mandate create → revoke lifecycle', async ({ make }) => {
    const adapter = make();
    const { mandate, step } = await createMandate(adapter, {
      scheme: 'sepa-core',
      customerId: 'cus_1',
      amountCentsCap: 10_000,
      currency: 'eur',
    });
    expect(mandate.state).toBe('active');
    expect(step.metadata.scheme).toBe('sepa-core');
    expect(mandate.amountCentsCap).toBe(10_000);
    const revoked = await revokeMandate(adapter, mandate);
    expect(revoked.state).toBe('revoked');
    expect(mandate.state).toBe('revoked');
  });

  it.each(providers)('$name: SEPA B2B mandate flags requiresDoubleOptIn', async ({ make }) => {
    const adapter = make();
    const { step } = await createMandate(adapter, {
      scheme: 'sepa-b2b',
      customerId: 'cus_b2b',
      currency: 'eur',
    });
    expect(step.metadata.requiresDoubleOptIn).toBe(true);
    expect(step.metadata.scheme).toBe('sepa-b2b');
  });

  it('rejects revoking an already-revoked mandate', async () => {
    const adapter = createStripeMock();
    const { mandate } = await createMandate(adapter, {
      scheme: 'bacs',
      customerId: 'cus_z',
    });
    await revokeMandate(adapter, mandate);
    await expect(revokeMandate(adapter, mandate)).rejects.toThrow(/revoked/);
  });

  it('open-banking consent grant emits scopes', async () => {
    const adapter = createPaddleMock();
    const step = await grantConsent(adapter, {
      customerId: 'cus_ob',
      scopes: ['accounts', 'payments'],
      validForMs: 30 * 24 * 60 * 60 * 1000,
    });
    expect(step.metadata.scopes).toBe('accounts,payments');
    expect(step.metadata.validForMs).toBe(30 * 24 * 60 * 60 * 1000);
    expect(step.state).toBe('granted');
  });

  it('consent default validity is 90 days', async () => {
    const adapter = createLemonSqueezyMock();
    const step = await grantConsent(adapter, {
      customerId: 'cus_ob2',
      scopes: ['accounts'],
    });
    expect(step.metadata.validForMs).toBe(90 * 24 * 60 * 60 * 1000);
  });

  it('mandate history captures both create + revoke steps', async () => {
    const adapter = createStripeMock();
    const { mandate } = await createMandate(adapter, {
      scheme: 'open-banking',
      customerId: 'cus_h',
    });
    await revokeMandate(adapter, mandate);
    expect(mandate.history).toHaveLength(2);
    expect(mandate.history[0]?.state).toBe('active');
    expect(mandate.history[1]?.state).toBe('revoked');
  });
});
