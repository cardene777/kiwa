/**
 * v1.41-5 docs 補強 (Issue #1148 / CAR-981) — tutorial 88-90 code snippet
 * validation for `@kiwa/payment` v0.5 advanced III 8 axis (Embedded
 * finance + BNPL + Crypto payment + FX cross-border + Recurring revenue
 * advanced + Payment orchestration II + Fraud detection advanced +
 * Regulatory reporting).
 *
 * `docs/tutorials/88-embedded-finance-bnpl.md` /
 * `docs/tutorials/89-crypto-payment-fx.md` /
 * `docs/tutorials/90-recurring-orchestration-fraud-regulatory.md`
 * に載っている snippet が実際に動作することを担保する。
 *
 * v1.23 → v1.41 で 19 milestone 連続 snippet validation streak を延伸.
 */
import { describe, expect, it } from 'vitest';
import {
  abstractGas,
  chargeLateFee,
  closeAccount,
  completeSettlement,
  computeMrr,
  computeNrr,
  confirmTx,
  createBnplPlan,
  createCryptoInvoice,
  createPaddleMock,
  createStripeMock,
  expireRate,
  fileSar,
  flagVelocity,
  initiateSettlement,
  issueCard,
  linkWallet,
  lockForAudit,
  lockRate,
  markInstallmentPaid,
  openAccount,
  recordChurn,
  recordContraction,
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
  verifyKyb,
  verifyKyc,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 88 — Embedded finance + BNPL
// (openAccount → KYC → KYB → issueCard → createBnplPlan → schedule → risk →
//  lateFee → paid)
// ---------------------------------------------------------------------------

describe('tutorial 88 — embedded account binding', () => {
  it('opens an account and moves state to account-opened (tutorial: openAccount snippet)', async () => {
    const adapter = createStripeMock();
    const { session, step } = await openAccount(adapter, {
      accountId: 'acc_1',
      customerId: 'cus_1',
      currency: 'usd',
    });
    expect(step.neutralEvent).toBe('embedded.account_opened');
    expect(session.state).toBe('account-opened');
    expect(session.kycStatus).toBe('pending');
    expect(session.kybStatus).toBe('verified'); // default requireKyb=false
  });

  it('keeps KYB pending when requireKyb=true (tutorial: requireKyb snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_2',
      customerId: 'cus_2',
      config: { requireKyb: true },
    });
    expect(session.kybStatus).toBe('pending');
    expect(session.config.requireKyb).toBe(true);
  });
});

describe('tutorial 88 — embedded KYC score gate', () => {
  it('moves to kyc-verified on score >= minScore (tutorial: verifyKyc pass snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_3',
      customerId: 'cus_3',
    });
    const step = await verifyKyc(adapter, session, { score: 80 });
    expect(step.metadata.passed).toBe(true);
    expect(session.state).toBe('kyc-verified');
    expect(session.kycStatus).toBe('verified');
  });

  it('suspends the account when score < minScore (tutorial: verifyKyc fail snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_4',
      customerId: 'cus_4',
    });
    const step = await verifyKyc(adapter, session, { score: 30 });
    expect(step.metadata.passed).toBe(false);
    expect(session.state).toBe('suspended');
    expect(session.kycStatus).toBe('failed');
  });

  it('rejects a score outside 0-100 (tutorial: kyc bounds snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_5',
      customerId: 'cus_5',
    });
    await expect(verifyKyc(adapter, session, { score: 101 })).rejects.toThrow(
      /between 0 and 100/,
    );
  });
});

describe('tutorial 88 — embedded KYB business verification', () => {
  it('moves to kyb-verified on verified=true (tutorial: verifyKyb pass snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_6',
      customerId: 'cus_6',
      config: { requireKyb: true },
    });
    const step = await verifyKyb(adapter, session, {
      businessRegistryId: 'reg_1',
      verified: true,
    });
    expect(step.neutralEvent).toBe('embedded.kyb_verified');
    expect(session.state).toBe('kyb-verified');
  });

  it('throws when KYB is not required in config (tutorial: verifyKyb reject snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_7',
      customerId: 'cus_7',
    });
    await expect(
      verifyKyb(adapter, session, {
        businessRegistryId: 'reg_x',
        verified: true,
      }),
    ).rejects.toThrow(/not required/);
  });
});

describe('tutorial 88 — embedded card issuance', () => {
  it('issues a card after KYC verified (tutorial: issueCard success snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_8',
      customerId: 'cus_8',
    });
    await verifyKyc(adapter, session, { score: 90 });
    const step = await issueCard(adapter, session, {
      cardId: 'card_1',
      type: 'virtual',
      last4: '4242',
    });
    expect(step.metadata.cardId).toBe('card_1');
    expect(session.state).toBe('card-issued');
    expect(session.cardIds).toEqual(['card_1']);
  });

  it('blocks issuance when KYC not verified (tutorial: issueCard gate snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_9',
      customerId: 'cus_9',
    });
    await expect(
      issueCard(adapter, session, {
        cardId: 'card_bad',
        type: 'virtual',
        last4: '0000',
      }),
    ).rejects.toThrow(/KYC must be verified/);
  });

  it('closes account and blocks subsequent ops (tutorial: closeAccount snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_close',
      customerId: 'cus_close',
    });
    closeAccount(session);
    expect(session.state).toBe('closed');
    await expect(
      verifyKyc(adapter, session, { score: 100 }),
    ).rejects.toThrow(/closed/);
  });
});

describe('tutorial 88 — bnpl plan creation', () => {
  it('splits totalCents into equal installments (tutorial: createBnplPlan split snippet)', async () => {
    const adapter = createStripeMock();
    const { session, step } = await createBnplPlan(adapter, {
      planId: 'plan_1',
      customerId: 'cus_1',
      totalCents: 40000,
      currency: 'usd',
      config: { installments: 4 },
    });
    expect(step.neutralEvent).toBe('bnpl.plan_created');
    expect(session.installmentAmountCents).toBe(10000);
    expect(session.state).toBe('plan-created');
  });

  it('rejects installments < 2 (tutorial: single-installment guard snippet)', async () => {
    const adapter = createStripeMock();
    await expect(
      createBnplPlan(adapter, {
        planId: 'plan_bad',
        customerId: 'cus_1',
        totalCents: 1000,
        config: { installments: 1 },
      }),
    ).rejects.toThrow(/between 2 and 12/);
  });

  it('rejects totalCents <= 0 (tutorial: totalCents guard snippet)', async () => {
    const adapter = createStripeMock();
    await expect(
      createBnplPlan(adapter, {
        planId: 'plan_bad2',
        customerId: 'cus_1',
        totalCents: 0,
        config: { installments: 4 },
      }),
    ).rejects.toThrow(/totalCents must be positive/);
  });
});

describe('tutorial 88 — bnpl schedule installments', () => {
  it('advances the schedule pointer by 1 per call (tutorial: scheduleInstallment snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_2',
      customerId: 'cus_2',
      totalCents: 20000,
      config: { installments: 4 },
    });
    await scheduleInstallment(adapter, session);
    await scheduleInstallment(adapter, session);
    expect(session.installmentsScheduled).toBe(2);
    expect(session.state).toBe('installments-scheduled');
  });

  it('throws when all installments already scheduled (tutorial: over-schedule guard snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_3',
      customerId: 'cus_3',
      totalCents: 8000,
      config: { installments: 2 },
    });
    await scheduleInstallment(adapter, session);
    await scheduleInstallment(adapter, session);
    await expect(scheduleInstallment(adapter, session)).rejects.toThrow(
      /already scheduled/,
    );
  });
});

describe('tutorial 88 — bnpl risk scoring', () => {
  it('moves to risk-scored on score >= minRiskScore (tutorial: scoreRisk pass snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_4',
      customerId: 'cus_4',
      totalCents: 12000,
      config: { installments: 3 },
    });
    const step = await scoreRisk(adapter, session, {
      score: 70,
      creditBureau: 'experian',
    });
    expect(step.metadata.passed).toBe(true);
    expect(session.state).toBe('risk-scored');
  });

  it('moves to defaulted on score < minRiskScore (tutorial: scoreRisk fail snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_5',
      customerId: 'cus_5',
      totalCents: 12000,
      config: { installments: 3 },
    });
    const step = await scoreRisk(adapter, session, {
      score: 30,
      creditBureau: 'equifax',
    });
    expect(step.metadata.passed).toBe(false);
    expect(session.state).toBe('defaulted');
  });
});

describe('tutorial 88 — bnpl late fee + settlement', () => {
  it('accumulates late fees across missed installments (tutorial: chargeLateFee snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_6',
      customerId: 'cus_6',
      totalCents: 12000,
      config: { installments: 3, lateFeeCents: 500 },
    });
    await scoreRisk(adapter, session, { score: 70 });
    await chargeLateFee(adapter, session, { installmentIndex: 1 });
    await chargeLateFee(adapter, session, { installmentIndex: 2 });
    expect(session.lateFeesTotalCents).toBe(1000);
    expect(session.state).toBe('late-fee-charged');
  });

  it('marks the plan settled once all installments are paid (tutorial: markInstallmentPaid snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_7',
      customerId: 'cus_7',
      totalCents: 6000,
      config: { installments: 3 },
    });
    await scoreRisk(adapter, session, { score: 80 });
    markInstallmentPaid(session);
    markInstallmentPaid(session);
    markInstallmentPaid(session);
    expect(session.state).toBe('settled');
    expect(session.installmentsPaid).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 89 — Crypto payment + FX cross-border
// (createCryptoInvoice → confirmTx → abstractGas → linkWallet →
//  startFxTransfer → lockRate → initiateSettlement → completeSettlement →
//  expireRate)
// ---------------------------------------------------------------------------

describe('tutorial 89 — crypto invoice creation', () => {
  it('creates an invoice on ethereum + USDC (tutorial: createCryptoInvoice snippet)', async () => {
    const adapter = createStripeMock();
    const { session, step } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_1',
      customerId: 'cus_1',
      amountCents: 5000,
      currency: 'usd',
      chain: 'ethereum',
      token: 'USDC',
    });
    expect(step.neutralEvent).toBe('crypto.invoice_created');
    expect(session.state).toBe('invoice-created');
    expect(session.chain).toBe('ethereum');
    expect(session.token).toBe('USDC');
  });

  it('rejects amountCents <= 0 (tutorial: crypto amountCents guard snippet)', async () => {
    const adapter = createStripeMock();
    await expect(
      createCryptoInvoice(adapter, {
        invoiceId: 'inv_bad',
        customerId: 'cus_1',
        amountCents: 0,
        chain: 'polygon',
        token: 'USDT',
      }),
    ).rejects.toThrow(/amountCents must be positive/);
  });
});

describe('tutorial 89 — crypto tx confirmation gate', () => {
  it('stays awaiting until confirmations reach requiredConfirmations (tutorial: confirmTx below-threshold snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_2',
      customerId: 'cus_2',
      amountCents: 5000,
      chain: 'base',
      token: 'USDC',
    });
    const step = await confirmTx(adapter, session, {
      txHash: '0xabc',
      confirmations: 1,
    });
    expect(step.metadata.confirmations).toBe(1);
    expect(session.state).toBe('awaiting-confirmation');
  });

  it('moves to confirmed when confirmations >= requiredConfirmations (tutorial: confirmTx pass snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_3',
      customerId: 'cus_3',
      amountCents: 5000,
      chain: 'arbitrum',
      token: 'USDC',
    });
    await confirmTx(adapter, session, { txHash: '0xdef', confirmations: 3 });
    expect(session.state).toBe('confirmed');
    expect(session.txHash).toBe('0xdef');
  });
});

describe('tutorial 89 — crypto gas abstraction', () => {
  it('records paymaster + gas subsidy (tutorial: abstractGas snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_4',
      customerId: 'cus_4',
      amountCents: 5000,
      chain: 'ethereum',
      token: 'USDC',
    });
    const step = await abstractGas(adapter, session, {
      paymasterAddress: '0xpaymaster',
      gasSubsidyCents: 30,
    });
    expect(step.metadata.paymasterAddress).toBe('0xpaymaster');
    expect(step.metadata.gasSubsidyCents).toBe(30);
    expect(session.state).toBe('gas-abstracted');
  });

  it('throws when gas abstraction is disabled in config (tutorial: gas disabled snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_5',
      customerId: 'cus_5',
      amountCents: 5000,
      chain: 'polygon',
      token: 'USDT',
      config: { gasAbstractionEnabled: false },
    });
    await expect(
      abstractGas(adapter, session, {
        paymasterAddress: '0xpm',
        gasSubsidyCents: 20,
      }),
    ).rejects.toThrow(/gas abstraction disabled/);
  });
});

describe('tutorial 89 — crypto wallet linking', () => {
  it('binds wallet on non-empty signature (tutorial: linkWallet snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_6',
      customerId: 'cus_6',
      amountCents: 5000,
      chain: 'base',
      token: 'USDC',
    });
    const step = await linkWallet(adapter, session, {
      walletAddress: '0xwallet',
      signature: '0xsig123',
    });
    expect(step.metadata.walletAddress).toBe('0xwallet');
    expect(session.walletAddress).toBe('0xwallet');
    expect(session.state).toBe('wallet-linked');
  });

  it('refuses empty signature (tutorial: wallet signature guard snippet)', async () => {
    const adapter = createStripeMock();
    const { session } = await createCryptoInvoice(adapter, {
      invoiceId: 'inv_7',
      customerId: 'cus_7',
      amountCents: 5000,
      chain: 'arbitrum',
      token: 'ETH',
    });
    await expect(
      linkWallet(adapter, session, {
        walletAddress: '0xw',
        signature: '',
      }),
    ).rejects.toThrow(/signature required/);
  });
});

describe('tutorial 89 — fx rate lock', () => {
  it('locks a quote and computes amountToCents (tutorial: lockRate snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_1',
      customerId: 'cus_1',
    });
    const step = await lockRate(adapter, session, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_1',
      amountFromCents: 10000,
    });
    expect(step.metadata.quoteId).toBe('q_1');
    expect(step.metadata.amountToCents).toBe(9200);
    expect(session.state).toBe('rate-locked');
    expect(session.quote?.amountToCents).toBe(9200);
  });

  it('rejects non-positive rate (tutorial: rate guard snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_2',
      customerId: 'cus_2',
    });
    await expect(
      lockRate(adapter, session, {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0,
        quoteId: 'q_bad',
        amountFromCents: 10000,
      }),
    ).rejects.toThrow(/rate must be positive/);
  });
});

describe('tutorial 89 — fx settlement flow', () => {
  it('initiates + completes settlement on the SEPA rail (tutorial: SEPA settlement snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_3',
      customerId: 'cus_3',
      config: { settlementRail: 'SEPA' },
    });
    await lockRate(adapter, session, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.9,
      quoteId: 'q_2',
      amountFromCents: 20000,
    });
    const init = await initiateSettlement(adapter, session, {
      beneficiaryIban: 'DE89370400440532013000',
      beneficiaryBic: 'DEUTDEFF',
    });
    expect(init.metadata.rail).toBe('SEPA');
    expect(session.state).toBe('settlement-initiated');
    const done = await completeSettlement(adapter, session, {
      settlementRef: 'stl_1',
    });
    expect(done.metadata.settlementRef).toBe('stl_1');
    expect(session.state).toBe('settlement-completed');
    expect(session.settledAmountCents).toBe(18000);
  });

  it('throws initiateSettlement when no rate locked (tutorial: no-rate settlement guard snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_4',
      customerId: 'cus_4',
    });
    await expect(
      initiateSettlement(adapter, session, {
        beneficiaryIban: 'GB29NWBK60161331926819',
      }),
    ).rejects.toThrow(/no rate locked/);
  });
});

describe('tutorial 89 — fx explicit rate expiration', () => {
  it('marks the rate lock expired (tutorial: expireRate snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_5',
      customerId: 'cus_5',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'GBP',
      toCurrency: 'USD',
      rate: 1.25,
      quoteId: 'q_3',
      amountFromCents: 8000,
    });
    const step = await expireRate(adapter, session);
    expect(step.neutralEvent).toBe('fx.rate_expired');
    expect(session.state).toBe('expired');
  });

  it('throws when no rate is locked (tutorial: expire-no-rate guard snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_6',
      customerId: 'cus_6',
    });
    await expect(expireRate(adapter, session)).rejects.toThrow(
      /no rate locked/,
    );
  });
});

// ---------------------------------------------------------------------------
// Tutorial 90 — Recurring revenue + Orchestration II + Fraud detection +
// Regulatory reporting
// (startRecurringRevenue → computeMrr → recordChurn → recordExpansion →
//  computeNrr → startOrchestrationII → smartRoute → scoreMl → triggerFallback →
//  startFraudDetection → scoreDevice → verifyBiometric → flagVelocity →
//  scoreMlBlock → startRegulatoryReporting → reportPci → reportPsd2 →
//  reportDora → fileSar → lockForAudit)
// ---------------------------------------------------------------------------

describe('tutorial 90 — rr MRR + ARR computation', () => {
  it('computes MRR + ARR from the initial snapshot (tutorial: computeMrr snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_1',
      customerId: 'cus_1',
      mrrStartCents: 100000,
    });
    const step = await computeMrr(adapter, session);
    expect(step.metadata.mrrCents).toBe(100000);
    expect(step.metadata.arrCents).toBe(1200000);
    expect(session.state).toBe('mrr-computed');
  });

  it('rejects negative mrrStartCents (tutorial: mrrStart guard snippet)', () => {
    expect(() =>
      startRecurringRevenue({
        cohortId: 'cohort_bad',
        customerId: 'cus_1',
        mrrStartCents: -1,
      }),
    ).toThrow(/non-negative/);
  });
});

describe('tutorial 90 — rr churn + expansion + contraction', () => {
  it('records churn and decrements mrrEnd (tutorial: recordChurn snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_2',
      customerId: 'cus_2',
      mrrStartCents: 100000,
    });
    await recordChurn(adapter, session, {
      churnCents: 20000,
      subscriptionId: 'sub_1',
    });
    expect(session.snapshot.mrrEndCents).toBe(80000);
    expect(session.snapshot.churnCents).toBe(20000);
    expect(session.state).toBe('churn-recorded');
  });

  it('records expansion and increments mrrEnd (tutorial: recordExpansion snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_3',
      customerId: 'cus_3',
      mrrStartCents: 100000,
    });
    await recordExpansion(adapter, session, {
      expansionCents: 15000,
      subscriptionId: 'sub_2',
      kind: 'seat-add',
    });
    expect(session.snapshot.mrrEndCents).toBe(115000);
    expect(session.snapshot.expansionCents).toBe(15000);
    expect(session.state).toBe('expansion-recorded');
  });

  it('records contraction as a separate bucket (tutorial: recordContraction snippet)', () => {
    const session = startRecurringRevenue({
      cohortId: 'cohort_4',
      customerId: 'cus_4',
      mrrStartCents: 50000,
    });
    recordContraction(session, { contractionCents: 5000 });
    expect(session.snapshot.contractionCents).toBe(5000);
    expect(session.snapshot.mrrEndCents).toBe(45000);
  });
});

describe('tutorial 90 — rr NRR rollup', () => {
  it('computes NRR > 100 when expansion beats churn (tutorial: computeNrr snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_5',
      customerId: 'cus_5',
      mrrStartCents: 100000,
    });
    await recordChurn(adapter, session, {
      churnCents: 5000,
      subscriptionId: 'sub_x',
    });
    await recordExpansion(adapter, session, {
      expansionCents: 15000,
      subscriptionId: 'sub_y',
      kind: 'upgrade',
    });
    const step = await computeNrr(adapter, session);
    expect(step.metadata.nrr).toBe(110);
    expect(session.state).toBe('nrr-computed');
  });

  it('handles mrrStartCents = 0 without divide-by-zero (tutorial: NRR zero-guard snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRecurringRevenue({
      cohortId: 'cohort_6',
      customerId: 'cus_6',
      mrrStartCents: 0,
    });
    await computeNrr(adapter, session);
    expect(session.computedNrr).toBe(0);
  });
});

describe('tutorial 90 — po2 smart routing', () => {
  it('routes through the primary provider on first call (tutorial: smartRoute snippet)', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startOrchestrationII({
      intentId: 'pi_1',
      amountCents: 5000,
      customerId: 'cus_1',
      config: { providers: ['stripe', 'paddle'] },
    });
    const step = await smartRoute([stripe, paddle], session);
    expect(step.metadata.provider).toBe('stripe');
    expect(session.attemptCount).toBe(1);
    expect(session.state).toBe('smart-routed');
  });

  it('rejects empty providers config (tutorial: empty-providers guard snippet)', () => {
    expect(() =>
      startOrchestrationII({
        intentId: 'pi_bad',
        amountCents: 5000,
        customerId: 'cus_1',
        config: { providers: [] },
      }),
    ).toThrow(/providers must not be empty/);
  });
});

describe('tutorial 90 — po2 ML score + fallback', () => {
  it('scores ML and flags pass/fail (tutorial: scoreMl snippet)', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startOrchestrationII({
      intentId: 'pi_2',
      amountCents: 5000,
      customerId: 'cus_2',
      config: { providers: ['stripe', 'paddle'] },
    });
    await smartRoute([stripe, paddle], session);
    const step = await scoreMl([stripe, paddle], session, {
      score: 0.7,
      features: { bin_country: 1, velocity: 2 },
    });
    expect(step.metadata.passed).toBe(true);
    expect(session.mlScore).toBe(0.7);
    expect(session.state).toBe('ml-scored');
  });

  it('triggers fallback to the next provider in the ladder (tutorial: triggerFallback snippet)', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startOrchestrationII({
      intentId: 'pi_3',
      amountCents: 5000,
      customerId: 'cus_3',
      config: { providers: ['stripe', 'paddle'] },
    });
    await smartRoute([stripe, paddle], session);
    const step = await triggerFallback([stripe, paddle], session);
    expect(step.metadata.toProvider).toBe('paddle');
    expect(session.currentIndex).toBe(1);
    expect(session.state).toBe('fallback-triggered');
  });

  it('exhausts the cascade when all providers are tried (tutorial: cascade-exhausted snippet)', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const session = startOrchestrationII({
      intentId: 'pi_4',
      amountCents: 5000,
      customerId: 'cus_4',
      config: { providers: ['stripe', 'paddle'], maxAttempts: 10 },
    });
    await smartRoute([stripe, paddle], session);
    await triggerFallback([stripe, paddle], session);
    const exhaust = await triggerFallback([stripe, paddle], session);
    expect(exhaust.neutralEvent).toBe('po2.cascade_exhausted');
    expect(session.state).toBe('cascade-exhausted');
  });
});

describe('tutorial 90 — fraud device + biometric signals', () => {
  it('scores device fingerprint (tutorial: scoreDevice snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_1',
      customerId: 'cus_1',
      amountCents: 5000,
    });
    const step = await scoreDevice(adapter, session, {
      score: 75,
      fingerprint: 'fp_abc',
      ipAddress: '1.2.3.4',
    });
    expect(step.metadata.passed).toBe(true);
    expect(session.deviceScore).toBe(75);
    expect(session.state).toBe('device-scored');
  });

  it('verifies biometric with confidence gate (tutorial: verifyBiometric snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_2',
      customerId: 'cus_2',
      amountCents: 5000,
    });
    const step = await verifyBiometric(adapter, session, {
      passed: true,
      confidence: 0.9,
      signals: ['typing', 'mouse'],
    });
    expect(step.metadata.passed).toBe(true);
    expect(session.biometricPassed).toBe(true);
    expect(session.state).toBe('biometric-verified');
  });
});

describe('tutorial 90 — fraud velocity + ML fusion', () => {
  it('flags velocity when over the hourly limit (tutorial: flagVelocity snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_3',
      customerId: 'cus_3',
      amountCents: 5000,
      config: { maxVelocityPerHour: 5 },
    });
    const step = await flagVelocity(adapter, session, {
      attemptsInWindow: 8,
      windowMs: 3_600_000,
    });
    expect(step.metadata.overLimit).toBe(true);
    expect(session.state).toBe('velocity-flagged');
  });

  it('blocks when ML score >= threshold (tutorial: scoreMlBlock block snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_4',
      customerId: 'cus_4',
      amountCents: 5000,
    });
    const step = await scoreMlBlock(adapter, session, {
      score: 0.9,
      modelVersion: 'v1',
      features: { device: 20, biometric: 30 },
    });
    expect(step.metadata.verdict).toBe('block');
    expect(session.verdict).toBe('block');
    expect(session.state).toBe('ml-blocked');
  });

  it('accepts when ML score is well below threshold (tutorial: scoreMlBlock accept snippet)', async () => {
    const adapter = createStripeMock();
    const session = startFraudDetection({
      transactionId: 'tx_5',
      customerId: 'cus_5',
      amountCents: 5000,
    });
    const step = await scoreMlBlock(adapter, session, {
      score: 0.1,
      modelVersion: 'v1',
      features: { device: 80, biometric: 90 },
    });
    expect(step.metadata.verdict).toBe('accept');
    expect(session.state).toBe('accepted');
  });
});

describe('tutorial 90 — reg PCI + PSD2 + DORA reports', () => {
  it('files PCI DSS attestation (tutorial: reportPci snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_1',
      customerId: 'cus_1',
    });
    const step = await reportPci(adapter, session, {
      reportId: 'pci_q1_2026',
      period: 'quarterly',
      fingerprint: 'fp_pci',
      saqLevel: 'D',
    });
    expect(step.metadata.saqLevel).toBe('D');
    expect(session.state).toBe('pci-reported');
    expect(session.reports).toHaveLength(1);
  });

  it('files PSD2 SCA compliance report (tutorial: reportPsd2 snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_2',
      customerId: 'cus_2',
    });
    const step = await reportPsd2(adapter, session, {
      reportId: 'psd2_2026_q1',
      period: 'quarterly',
      challengeRate: 0.15,
      exemptionCount: 12000,
      fingerprint: 'fp_psd2',
    });
    expect(step.metadata.challengeRate).toBe(0.15);
    expect(session.state).toBe('psd2-reported');
  });

  it('files DORA ICT risk report (tutorial: reportDora snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_3',
      customerId: 'cus_3',
    });
    const step = await reportDora(adapter, session, {
      reportId: 'dora_2026',
      period: 'annual',
      ictRiskScore: 25,
      thirdPartyCount: 45,
      incidentCount: 2,
      fingerprint: 'fp_dora',
    });
    expect(step.metadata.ictRiskScore).toBe(25);
    expect(session.state).toBe('dora-reported');
  });
});

describe('tutorial 90 — reg SAR + audit lock', () => {
  it('files a SAR with FinCEN (tutorial: fileSar snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_4',
      customerId: 'cus_4',
    });
    const step = await fileSar(adapter, session, {
      reportId: 'sar_1',
      regulator: 'FinCEN',
      reason: 'Unusual pattern of structured cash deposits',
      fingerprint: 'fp_sar',
    });
    expect(step.metadata.regulator).toBe('FinCEN');
    expect(session.sarFiled).toBe(true);
    expect(session.state).toBe('sar-filed');
  });

  it('refuses a second SAR filing on the same session (tutorial: SAR one-shot snippet)', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_5',
      customerId: 'cus_5',
    });
    await fileSar(adapter, session, {
      reportId: 'sar_2',
      regulator: 'NCA',
      reason: 'Suspicious transaction chain',
      fingerprint: 'fp_sar2',
    });
    await expect(
      fileSar(adapter, session, {
        reportId: 'sar_3',
        regulator: 'NCA',
        reason: 'again',
        fingerprint: 'fp_sar3',
      }),
    ).rejects.toThrow(/already filed/);
  });

  it('locks the session for audit (tutorial: lockForAudit snippet)', () => {
    const session = startRegulatoryReporting({
      entityId: 'ent_6',
      customerId: 'cus_6',
    });
    lockForAudit(session);
    expect(session.state).toBe('audit-locked');
  });
});
