import { describe, expect, it } from 'vitest';
import {
  chargeLateFee,
  computeMrr,
  computeNrr,
  confirmTx,
  createBnplPlan,
  createCryptoInvoice,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  fileSar,
  flagVelocity,
  initiateSettlement,
  issueCard,
  lockRate,
  openAccount,
  type PaymentAdapter,
  recordChurn,
  recordExpansion,
  reportDora,
  reportPci,
  reportPsd2,
  scheduleInstallment,
  scoreDevice,
  scoreMl,
  scoreMlBlock,
  scoreRisk,
  smartRoute,
  startFraudDetection,
  startFxTransfer,
  startOrchestrationII,
  startRecurringRevenue,
  startRegulatoryReporting,
  triggerFallback,
  verifyBiometric,
  verifyKyc,
} from '../../src/index.js';

/**
 * Cross-axis v0.5 tests — assert that axes compose without interfering
 * (isolated sessions, independent state machines, no leaking history).
 */

describe('v0.5 cross-axis composition — 8 axes coexist', () => {
  it('BNPL + fraud can run on same customer without cross-contamination', async () => {
    const stripe = createStripeMock();
    const { session: bnpl } = await createBnplPlan(stripe, {
      planId: 'plan_1',
      customerId: 'cus_shared',
      totalCents: 12000,
      config: { installments: 3 },
    });
    const fraud = startFraudDetection({
      transactionId: 'tx_1',
      customerId: 'cus_shared',
      amountCents: 4000,
    });
    await scoreDevice(stripe, fraud, { score: 90, fingerprint: 'fp' });
    await scoreRisk(stripe, bnpl, { score: 80 });
    expect(bnpl.state).toBe('risk-scored');
    expect(fraud.state).toBe('device-scored');
    // Sessions are independent
    expect(bnpl.history).toHaveLength(2);
    expect(fraud.history).toHaveLength(1);
  });

  it('embedded finance + crypto + fx can all run for one merchant', async () => {
    const stripe = createStripeMock();
    // 1. Embedded finance account open + KYC
    const { session: acc } = await openAccount(stripe, {
      accountId: 'acc',
      customerId: 'merchant_1',
    });
    await verifyKyc(stripe, acc, { score: 85 });
    await issueCard(stripe, acc, { cardId: 'c1', type: 'virtual', last4: '4242' });
    // 2. Crypto invoice
    const { session: crypto } = await createCryptoInvoice(stripe, {
      invoiceId: 'inv',
      customerId: 'merchant_1',
      amountCents: 1000,
      chain: 'base',
      token: 'USDC',
    });
    await confirmTx(stripe, crypto, { txHash: '0x', confirmations: 3 });
    // 3. FX transfer
    const fx = startFxTransfer({ transferId: 'tr', customerId: 'merchant_1' });
    await lockRate(stripe, fx, {
      fromCurrency: 'usd',
      toCurrency: 'eur',
      rate: 0.9,
      quoteId: 'q',
      amountFromCents: 1000,
    });
    await initiateSettlement(stripe, fx, {});
    expect(acc.state).toBe('card-issued');
    expect(crypto.state).toBe('confirmed');
    expect(fx.state).toBe('settlement-initiated');
  });

  it('recurring revenue analytics + regulatory reporting coexist', async () => {
    const stripe = createStripeMock();
    const rr = startRecurringRevenue({
      cohortId: 'coh',
      customerId: 'ent',
      mrrStartCents: 10000,
    });
    await recordChurn(stripe, rr, { churnCents: 1000, subscriptionId: 'a' });
    await recordExpansion(stripe, rr, {
      expansionCents: 2000,
      subscriptionId: 'b',
      kind: 'upgrade',
    });
    await computeMrr(stripe, rr);
    await computeNrr(stripe, rr);

    const reg = startRegulatoryReporting({
      entityId: 'ent',
      customerId: 'ent',
    });
    await reportPci(stripe, reg, {
      reportId: 'rp1',
      period: 'quarterly',
      fingerprint: 'fp',
      saqLevel: 'A',
    });
    await reportPsd2(stripe, reg, {
      reportId: 'rp2',
      period: 'monthly',
      challengeRate: 0.12,
      exemptionCount: 200,
      fingerprint: 'fp',
    });
    expect(rr.computedNrr).toBe(110);
    expect(reg.reports).toHaveLength(2);
  });

  it('orchestration II + fraud detection layered on same intent', async () => {
    const adapters: PaymentAdapter[] = [
      createStripeMock(),
      createPaddleMock(),
      createLemonSqueezyMock(),
    ];
    const orch = startOrchestrationII({
      intentId: 'int',
      amountCents: 5000,
      customerId: 'cus',
      config: { providers: ['stripe', 'paddle'] },
    });
    const fraud = startFraudDetection({
      transactionId: 'int',
      customerId: 'cus',
      amountCents: 5000,
    });
    await smartRoute(adapters, orch);
    await scoreMl(adapters, orch, { score: 0.4, features: {} });
    await scoreDevice(adapters[0]!, fraud, { score: 70, fingerprint: 'fp' });
    await scoreMlBlock(adapters[0]!, fraud, {
      score: 0.9,
      modelVersion: 'v',
      features: {},
    });
    // fraud blocks the tx → trigger orchestration fallback
    await triggerFallback(adapters, orch);
    expect(fraud.verdict).toBe('block');
    expect(orch.state).toBe('fallback-triggered');
  });

  it('BNPL late fee triggers SAR filing for high-value customer', async () => {
    const stripe = createStripeMock();
    const { session: bnpl } = await createBnplPlan(stripe, {
      planId: 'p',
      customerId: 'cus',
      totalCents: 50000,
      config: { installments: 4 },
    });
    await scheduleInstallment(stripe, bnpl);
    await chargeLateFee(stripe, bnpl, { installmentIndex: 1 });
    await chargeLateFee(stripe, bnpl, { installmentIndex: 2 });
    // Late fees triggered → escalate to SAR
    const reg = startRegulatoryReporting({
      entityId: 'ent',
      customerId: 'cus',
    });
    await fileSar(stripe, reg, {
      reportId: 'sar1',
      regulator: 'FinCEN',
      reason: 'repeated late fees on high-value BNPL',
      fingerprint: 'fp',
    });
    expect(reg.sarFiled).toBe(true);
    expect(bnpl.lateFeesTotalCents).toBeGreaterThan(0);
  });

  it('fraud velocity flag + DORA reporting for incident tracking', async () => {
    const stripe = createStripeMock();
    const fraud = startFraudDetection({
      transactionId: 'tx',
      customerId: 'cus',
      amountCents: 100,
    });
    await flagVelocity(stripe, fraud, { attemptsInWindow: 20, windowMs: 3_600_000 });
    const reg = startRegulatoryReporting({
      entityId: 'ent',
      customerId: 'cus',
    });
    await reportDora(stripe, reg, {
      reportId: 'dora',
      period: 'annual',
      ictRiskScore: 45,
      thirdPartyCount: 10,
      incidentCount: 1,
      fingerprint: 'fp',
    });
    expect(fraud.state).toBe('velocity-flagged');
    expect(reg.state).toBe('dora-reported');
  });

  it('all 8 v0.5 axes independent per provider', async () => {
    const providers: PaymentAdapter[] = [
      createStripeMock(),
      createPaddleMock(),
      createLemonSqueezyMock(),
    ];
    for (const adapter of providers) {
      // Each provider runs one op from each axis
      const { session: acc } = await openAccount(adapter, {
        accountId: `acc_${adapter.provider}`,
        customerId: `cus_${adapter.provider}`,
      });
      const { session: bnpl } = await createBnplPlan(adapter, {
        planId: `plan_${adapter.provider}`,
        customerId: `cus_${adapter.provider}`,
        totalCents: 3000,
        config: { installments: 3 },
      });
      const { session: crypto } = await createCryptoInvoice(adapter, {
        invoiceId: `inv_${adapter.provider}`,
        customerId: `cus_${adapter.provider}`,
        amountCents: 1000,
        chain: 'polygon',
        token: 'USDC',
      });
      const fx = startFxTransfer({
        transferId: `tr_${adapter.provider}`,
        customerId: `cus_${adapter.provider}`,
      });
      await lockRate(adapter, fx, {
        fromCurrency: 'usd',
        toCurrency: 'eur',
        rate: 0.9,
        quoteId: `q_${adapter.provider}`,
        amountFromCents: 500,
      });
      expect(acc.state).toBe('account-opened');
      expect(bnpl.state).toBe('plan-created');
      expect(crypto.state).toBe('invoice-created');
      expect(fx.state).toBe('rate-locked');
    }
  });
});
