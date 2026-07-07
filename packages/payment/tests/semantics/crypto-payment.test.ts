import { describe, expect, it } from 'vitest';
import {
  abstractGas,
  confirmTx,
  createCryptoInvoice,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  linkWallet,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('crypto-payment axis — stablecoin + on-chain + gas abstraction + wallet', () => {
  it.each(providers)('$name: createCryptoInvoice emits invoice_created', async ({ make }) => {
    const adapter = make();
    const { session, step } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_1',
      customerId: 'cus_1',
      amountCents: 5000,
      chain: 'ethereum',
      token: 'USDC',
    });
    expect(step.neutralEvent).toBe('crypto.invoice_created');
    expect(session.state).toBe('invoice-created');
    expect(session.chain).toBe('ethereum');
    expect(session.token).toBe('USDC');
  });

  it('createCryptoInvoice rejects non-positive amount', async () => {
    const adapter = createStripeMock();
    await expect(
      createCryptoInvoice(adapter, {
        invoiceId: 'inv_bad',
        customerId: 'cus',
        amountCents: 0,
        chain: 'ethereum',
        token: 'USDC',
      }),
    ).rejects.toThrow(/positive/);
  });

  it('createCryptoInvoice default config: 3 confirmations + 15m expiration', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_def',
      customerId: 'cus',
      amountCents: 1000,
      chain: 'polygon',
      token: 'USDT',
    });
    expect(session.config.requiredConfirmations).toBe(3);
    expect(session.config.expirationMs).toBe(15 * 60 * 1000);
    expect(session.config.gasAbstractionEnabled).toBe(true);
  });

  it.each(providers)('$name: confirmTx with confirmations < required stays awaiting', async ({ make }) => {
    const adapter = make();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_2',
      customerId: 'cus',
      amountCents: 1000,
      chain: 'ethereum',
      token: 'USDC',
      config: { requiredConfirmations: 5 },
    });
    const step = await confirmTx(adapter, session, { txHash: '0xabc', confirmations: 2 });
    expect(step.neutralEvent).toBe('crypto.tx_confirmed');
    expect(session.state).toBe('awaiting-confirmation');
    expect(session.confirmations).toBe(2);
    expect(session.txHash).toBe('0xabc');
  });

  it('confirmTx with confirmations >= required moves to confirmed', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_c',
      customerId: 'cus',
      amountCents: 2000,
      chain: 'base',
      token: 'USDC',
      config: { requiredConfirmations: 3 },
    });
    const step = await confirmTx(adapter, session, { txHash: '0xdef', confirmations: 3 });
    expect(session.state).toBe('confirmed');
    expect(step.metadata.confirmations).toBe(3);
  });

  it('confirmTx rejects when invoice expired (elapsed > expirationMs)', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_exp',
      customerId: 'cus',
      amountCents: 1000,
      chain: 'ethereum',
      token: 'USDC',
      config: { expirationMs: 1 },
    });
    // wait a bit
    await new Promise((r) => setTimeout(r, 10));
    await expect(
      confirmTx(adapter, session, { txHash: '0xexp', confirmations: 5 }),
    ).rejects.toThrow(/expired/);
    expect(session.state).toBe('expired');
  });

  it('confirmTx rejects on already-expired session', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_x',
      customerId: 'cus',
      amountCents: 1000,
      chain: 'ethereum',
      token: 'USDC',
      config: { expirationMs: 1 },
    });
    await new Promise((r) => setTimeout(r, 5));
    await confirmTx(adapter, session, { txHash: '0x', confirmations: 5 }).catch(() => {
      // ignore, sets state to expired
    });
    await expect(confirmTx(adapter, session, { txHash: '0x2', confirmations: 1 })).rejects.toThrow(
      /expired/,
    );
  });

  it.each(providers)('$name: abstractGas emits gas_abstracted', async ({ make }) => {
    const adapter = make();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_g',
      customerId: 'cus',
      amountCents: 3000,
      chain: 'arbitrum',
      token: 'USDC',
    });
    const step = await abstractGas(adapter, session, {
      paymasterAddress: '0xpaymaster',
      gasSubsidyCents: 50,
    });
    expect(step.neutralEvent).toBe('crypto.gas_abstracted');
    expect(step.metadata.paymasterAddress).toBe('0xpaymaster');
    expect(step.metadata.gasSubsidyCents).toBe(50);
    expect(session.state).toBe('gas-abstracted');
  });

  it('abstractGas rejects when disabled', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_no_gas',
      customerId: 'cus',
      amountCents: 1000,
      chain: 'ethereum',
      token: 'USDC',
      config: { gasAbstractionEnabled: false },
    });
    await expect(
      abstractGas(adapter, session, {
        paymasterAddress: '0x',
        gasSubsidyCents: 10,
      }),
    ).rejects.toThrow(/disabled/);
  });

  it('abstractGas rejects negative subsidy', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_neg',
      customerId: 'cus',
      amountCents: 1000,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      abstractGas(adapter, session, {
        paymasterAddress: '0x',
        gasSubsidyCents: -1,
      }),
    ).rejects.toThrow(/non-negative/);
  });

  it.each(providers)('$name: linkWallet emits wallet_linked', async ({ make }) => {
    const adapter = make();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_w',
      customerId: 'cus_w',
      amountCents: 1000,
      chain: 'ethereum',
      token: 'USDC',
    });
    const step = await linkWallet(adapter, session, {
      walletAddress: '0xdeadbeef',
      signature: '0xsig',
    });
    expect(step.neutralEvent).toBe('crypto.wallet_linked');
    expect(step.metadata.walletAddress).toBe('0xdeadbeef');
    expect(session.walletAddress).toBe('0xdeadbeef');
    expect(session.state).toBe('wallet-linked');
  });

  it('linkWallet rejects empty walletAddress', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_wba',
      customerId: 'cus',
      amountCents: 1000,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      linkWallet(adapter, session, { walletAddress: '', signature: '0xok' }),
    ).rejects.toThrow(/walletAddress must not be empty/);
  });

  it('linkWallet rejects empty signature', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_wsig',
      customerId: 'cus',
      amountCents: 1000,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      linkWallet(adapter, session, { walletAddress: '0xok', signature: '' }),
    ).rejects.toThrow(/signature required/);
  });

  it('supports all documented chains + tokens', async () => {
    const adapter = createStripeMock();
    const chains = ['ethereum', 'polygon', 'base', 'arbitrum', 'solana'] as const;
    const tokens = ['USDC', 'USDT', 'DAI', 'ETH', 'SOL'] as const;
    for (const chain of chains) {
      for (const token of tokens) {
        const { session } = await createCryptoInvoice(adapter, {
          invoiceId: `inv_${chain}_${token}`,
          customerId: 'cus_all',
          amountCents: 100,
          chain,
          token,
        });
        expect(session.chain).toBe(chain);
        expect(session.token).toBe(token);
      }
    }
  });

  it('history captures full lifecycle', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_hist',
      customerId: 'cus_hist',
      amountCents: 1000,
      chain: 'base',
      token: 'USDC',
    });
    await confirmTx(adapter, session, { txHash: '0x111', confirmations: 3 });
    await abstractGas(adapter, session, { paymasterAddress: '0xpm', gasSubsidyCents: 10 });
    await linkWallet(adapter, session, { walletAddress: '0xw', signature: '0xs' });
    expect(session.history).toHaveLength(4);
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'crypto.invoice_created',
      'crypto.tx_confirmed',
      'crypto.gas_abstracted',
      'crypto.wallet_linked',
    ]);
  });
});
