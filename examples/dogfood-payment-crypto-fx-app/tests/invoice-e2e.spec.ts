/**
 * Invoice end-to-end fidelity spec (crypto invoice axis: create + confirm
 * + gas abstraction + wallet link + status snapshot).
 *
 * Issue CAR-980 (v1.41-4) AC — the mock adapter drives a full crypto
 * invoice ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across six axes.
 *
 *  1. createInvoice seats a crypto invoice under a customer id + chain +
 *     token, and rejects duplicate invoice ids in the same session.
 *  2. confirmTx records on-chain confirmations, advances state to
 *     `confirmed` when confirmations >= required, and rejects invalid
 *     txHash / negative confirmations.
 *  3. abstractGas advances state to `gas-abstracted` when the invoice
 *     opted into paymaster subsidy at creation, and rejects when
 *     abstraction is disabled or subsidy is negative.
 *  4. linkWallet advances state to `wallet-linked` and rejects empty
 *     address / signature.
 *  5. checkInvoiceStatus returns the current snapshot after every op.
 *  6. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_CRYPTO_FX_ENV_MISSING` on every non-
 * integration environment (the default). Downstream tests inspect
 * {@link PaymentAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleInvoiceRequest,
  validateInvoiceRequest,
} from '../src/app/invoice/route.js';
import type { PaymentAdapter } from '../src/adapters/interface.js';

let mock: PaymentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — createInvoice', () => {
  it('axis 1: createInvoice seats a crypto invoice under customer id + chain + token', async () => {
    await mock.startInvoice({ sessionId: 'i1', provider: 'coinbase-commerce' });
    const result = await mock.createInvoice({
      sessionId: 'i1',
      invoiceId: 'inv_alice_1',
      customerId: 'cus_alice',
      amountCents: 100_00,
      currency: 'usd',
      chain: 'ethereum',
      token: 'USDC',
    });
    expect(result.invoiceId).toBe('inv_alice_1');
    expect(result.chain).toBe('ethereum');
    expect(result.token).toBe('USDC');
    expect(result.state).toBe('invoice-created');
    const trace = mock.traces().find((t) => t.op === 'createInvoice');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: createInvoice accepts multi-provider invoices across separate sessions', async () => {
    await mock.startInvoice({ sessionId: 'i2', provider: 'bitpay' });
    const i2 = await mock.createInvoice({
      sessionId: 'i2',
      invoiceId: 'inv_bitpay',
      customerId: 'cus_alice',
      amountCents: 500_00,
      chain: 'polygon',
      token: 'USDT',
    });
    expect(i2.chain).toBe('polygon');

    await mock.startInvoice({ sessionId: 'i2b', provider: 'moonpay' });
    const i2b = await mock.createInvoice({
      sessionId: 'i2b',
      invoiceId: 'inv_moonpay',
      customerId: 'cus_alice',
      amountCents: 200_00,
      chain: 'base',
      token: 'ETH',
    });
    expect(i2b.chain).toBe('base');
    expect(i2b.token).toBe('ETH');
  });

  it('axis 1: createInvoice rejects duplicate invoice id in the same session', async () => {
    await mock.startInvoice({ sessionId: 'i3', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i3',
      invoiceId: 'inv_dup',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      mock.createInvoice({
        sessionId: 'i3',
        invoiceId: 'inv_dup',
        customerId: 'cus_alice',
        amountCents: 100_00,
        chain: 'ethereum',
        token: 'USDC',
      }),
    ).rejects.toThrow('invoice_already_created');
  });

  it('axis 1: createInvoice rejects zero amountCents (semantics guard)', async () => {
    await mock.startInvoice({ sessionId: 'i4', provider: 'coinbase-commerce' });
    await expect(
      mock.createInvoice({
        sessionId: 'i4',
        invoiceId: 'inv_bad',
        customerId: 'cus_alice',
        amountCents: 0,
        chain: 'ethereum',
        token: 'USDC',
      }),
    ).rejects.toThrow();
  });

  it('axis 1: createInvoice without prior startInvoice reports invoice_session_not_found', async () => {
    await expect(
      mock.createInvoice({
        sessionId: 'never-started',
        invoiceId: 'inv_orphan',
        customerId: 'cus_alice',
        amountCents: 100_00,
        chain: 'ethereum',
        token: 'USDC',
      }),
    ).rejects.toThrow('invoice_session_not_found');
  });
});

describe('mock adapter — confirmTx', () => {
  it('axis 2: confirmTx advances state to confirmed once required confirmations reached', async () => {
    await mock.startInvoice({ sessionId: 'i5', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i5',
      invoiceId: 'inv_conf',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
      requiredConfirmations: 3,
    });
    const confirmed = await mock.confirmTx({
      sessionId: 'i5',
      invoiceId: 'inv_conf',
      txHash: '0xabc123',
      confirmations: 3,
    });
    expect(confirmed.state).toBe('confirmed');
    expect(confirmed.requiredConfirmations).toBe(3);
    expect(confirmed.txHash).toBe('0xabc123');
  });

  it('axis 2: confirmTx leaves state at awaiting-confirmation when below required', async () => {
    await mock.startInvoice({ sessionId: 'i6', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i6',
      invoiceId: 'inv_wait',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
      requiredConfirmations: 5,
    });
    const pending = await mock.confirmTx({
      sessionId: 'i6',
      invoiceId: 'inv_wait',
      txHash: '0xabc',
      confirmations: 2,
    });
    expect(pending.state).toBe('awaiting-confirmation');
    expect(pending.confirmations).toBe(2);
  });

  it('axis 2: confirmTx rejects negative confirmations', async () => {
    await mock.startInvoice({ sessionId: 'i7', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i7',
      invoiceId: 'inv_neg',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      mock.confirmTx({
        sessionId: 'i7',
        invoiceId: 'inv_neg',
        txHash: '0xok',
        confirmations: -1,
      }),
    ).rejects.toThrow('confirmations_out_of_range');
  });

  it('axis 2: confirmTx rejects empty txHash', async () => {
    await mock.startInvoice({ sessionId: 'i8', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i8',
      invoiceId: 'inv_empty',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      mock.confirmTx({
        sessionId: 'i8',
        invoiceId: 'inv_empty',
        txHash: '',
        confirmations: 3,
      }),
    ).rejects.toThrow('txHash_required');
  });

  it('axis 2: confirmTx on missing invoice reports invoice_not_found', async () => {
    await mock.startInvoice({ sessionId: 'i9', provider: 'coinbase-commerce' });
    await expect(
      mock.confirmTx({
        sessionId: 'i9',
        invoiceId: 'inv_missing',
        txHash: '0xok',
        confirmations: 3,
      }),
    ).rejects.toThrow('invoice_not_found');
  });
});

describe('mock adapter — abstractGas', () => {
  it('axis 3: abstractGas advances state to gas-abstracted when enabled', async () => {
    await mock.startInvoice({ sessionId: 'i10', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i10',
      invoiceId: 'inv_gas',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
      gasAbstractionEnabled: true,
    });
    const result = await mock.abstractGas({
      sessionId: 'i10',
      invoiceId: 'inv_gas',
      paymasterAddress: '0xpaymaster',
      gasSubsidyCents: 250,
    });
    expect(result.state).toBe('gas-abstracted');
    expect(result.paymasterAddress).toBe('0xpaymaster');
    expect(result.gasSubsidyCents).toBe(250);
  });

  it('axis 3: abstractGas rejects when gasAbstractionEnabled=false', async () => {
    await mock.startInvoice({ sessionId: 'i11', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i11',
      invoiceId: 'inv_nogas',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
      gasAbstractionEnabled: false,
    });
    await expect(
      mock.abstractGas({
        sessionId: 'i11',
        invoiceId: 'inv_nogas',
        paymasterAddress: '0xpaymaster',
        gasSubsidyCents: 100,
      }),
    ).rejects.toThrow();
  });

  it('axis 3: abstractGas rejects negative subsidy', async () => {
    await mock.startInvoice({ sessionId: 'i12', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i12',
      invoiceId: 'inv_negsub',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      mock.abstractGas({
        sessionId: 'i12',
        invoiceId: 'inv_negsub',
        paymasterAddress: '0xpaymaster',
        gasSubsidyCents: -10,
      }),
    ).rejects.toThrow();
  });

  it('axis 3: abstractGas rejects empty paymasterAddress', async () => {
    await mock.startInvoice({ sessionId: 'i13', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i13',
      invoiceId: 'inv_pmempty',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      mock.abstractGas({
        sessionId: 'i13',
        invoiceId: 'inv_pmempty',
        paymasterAddress: '',
        gasSubsidyCents: 100,
      }),
    ).rejects.toThrow('paymasterAddress_required');
  });
});

describe('mock adapter — linkWallet', () => {
  it('axis 4: linkWallet advances state to wallet-linked with valid signature', async () => {
    await mock.startInvoice({ sessionId: 'i14', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i14',
      invoiceId: 'inv_wal',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    const result = await mock.linkWallet({
      sessionId: 'i14',
      invoiceId: 'inv_wal',
      walletAddress: '0xwallet',
      signature: '0xsig'.padEnd(130, 'a'),
    });
    expect(result.state).toBe('wallet-linked');
    expect(result.walletAddress).toBe('0xwallet');
    expect(result.signatureLength).toBeGreaterThan(0);
  });

  it('axis 4: linkWallet rejects empty walletAddress', async () => {
    await mock.startInvoice({ sessionId: 'i15', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i15',
      invoiceId: 'inv_walempty',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      mock.linkWallet({
        sessionId: 'i15',
        invoiceId: 'inv_walempty',
        walletAddress: '',
        signature: '0xsig',
      }),
    ).rejects.toThrow();
  });

  it('axis 4: linkWallet rejects empty signature', async () => {
    await mock.startInvoice({ sessionId: 'i16', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i16',
      invoiceId: 'inv_sigempty',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    await expect(
      mock.linkWallet({
        sessionId: 'i16',
        invoiceId: 'inv_sigempty',
        walletAddress: '0xwallet',
        signature: '',
      }),
    ).rejects.toThrow();
  });
});

describe('mock adapter — checkInvoiceStatus + closeInvoice', () => {
  it('axis 5: checkInvoiceStatus reflects the most recent state after each op', async () => {
    await mock.startInvoice({ sessionId: 'i17', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i17',
      invoiceId: 'inv_stat',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    let status = await mock.checkInvoiceStatus({
      sessionId: 'i17',
      invoiceId: 'inv_stat',
    });
    expect(status.state).toBe('invoice-created');
    await mock.confirmTx({
      sessionId: 'i17',
      invoiceId: 'inv_stat',
      txHash: '0xh',
      confirmations: 3,
    });
    status = await mock.checkInvoiceStatus({
      sessionId: 'i17',
      invoiceId: 'inv_stat',
    });
    expect(status.state).toBe('confirmed');
    expect(status.txHash).toBe('0xh');
    expect(status.confirmations).toBe(3);
  });

  it('axis 5: closeInvoice detaches the session and further ops fail', async () => {
    await mock.startInvoice({ sessionId: 'i18', provider: 'coinbase-commerce' });
    await mock.createInvoice({
      sessionId: 'i18',
      invoiceId: 'inv_close',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    await mock.closeInvoice({ sessionId: 'i18' });
    await expect(
      mock.createInvoice({
        sessionId: 'i18',
        invoiceId: 'inv_close_dup',
        customerId: 'cus_alice',
        amountCents: 100_00,
        chain: 'ethereum',
        token: 'USDC',
      }),
    ).rejects.toThrow('invoice_session_not_found');
  });

  it('axis 5: closeInvoice on missing session reports invoice_session_not_found', async () => {
    await expect(
      mock.closeInvoice({ sessionId: 'never-started' }),
    ).rejects.toThrow('invoice_session_not_found');
  });
});

describe('route validation — HTTP body shape', () => {
  it('axis 6: validateInvoiceRequest accepts create shape', () => {
    const parsed = validateInvoiceRequest({
      kind: 'create',
      sessionId: 'i19',
      invoiceId: 'inv_ok',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 6: validateInvoiceRequest accepts confirm shape', () => {
    const parsed = validateInvoiceRequest({
      kind: 'confirm',
      sessionId: 'i19',
      invoiceId: 'inv_ok',
      txHash: '0xabc',
      confirmations: 3,
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 6: validateInvoiceRequest rejects invalid chain', () => {
    const parsed = validateInvoiceRequest({
      kind: 'create',
      sessionId: 'i19',
      invoiceId: 'inv_ok',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'invalid-chain',
      token: 'USDC',
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('chain_must_be_valid');
  });

  it('axis 6: validateInvoiceRequest rejects unknown kind', () => {
    const parsed = validateInvoiceRequest({
      kind: 'purge',
      sessionId: 'i19',
      invoiceId: 'inv_ok',
    });
    expect(parsed.ok).toBe(false);
  });

  it('axis 6: handleInvoiceRequest routes create + confirm end to end', async () => {
    await mock.startInvoice({ sessionId: 'i20', provider: 'coinbase-commerce' });
    const createRes = await handleInvoiceRequest(mock, {
      kind: 'create',
      sessionId: 'i20',
      invoiceId: 'inv_route',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    expect(createRes.ok).toBe(true);
    const confirmRes = await handleInvoiceRequest(mock, {
      kind: 'confirm',
      sessionId: 'i20',
      invoiceId: 'inv_route',
      txHash: '0xdef',
      confirmations: 3,
    });
    expect(confirmRes.ok).toBe(true);
    expect(confirmRes.state).toBe('confirmed');
  });

  it('axis 6: handleInvoiceRequest reports errorKind when adapter refuses', async () => {
    const res = await handleInvoiceRequest(mock, {
      kind: 'create',
      sessionId: 'never-started',
      invoiceId: 'inv_route',
      customerId: 'cus_alice',
      amountCents: 100_00,
      chain: 'ethereum',
      token: 'USDC',
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('invoice_session_not_found');
  });
});

describe('real adapter — env detection', () => {
  it('detectRealEnvMissing returns non-null when env keys are missing', () => {
    const previous = { ...process.env };
    delete process.env['KIWA_MODE'];
    delete process.env['CRYPTO_FX_STACK_READY'];
    expect(detectRealEnvMissing()).toBe('KIWA_CRYPTO_FX_ENV_MISSING');
    process.env = previous;
  });

  it('real adapter refuses createInvoice on non-integration environments', async () => {
    const real = makeRealAdapter();
    await expect(
      real.createInvoice({
        sessionId: 'r1',
        invoiceId: 'inv_real',
        customerId: 'cus_alice',
        amountCents: 100_00,
        chain: 'ethereum',
        token: 'USDC',
      }),
    ).rejects.toThrow('KIWA_CRYPTO_FX_ENV_MISSING');
    const trace = real.traces().find((t) => t.op === 'createInvoice');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_CRYPTO_FX_ENV_MISSING');
  });
});
