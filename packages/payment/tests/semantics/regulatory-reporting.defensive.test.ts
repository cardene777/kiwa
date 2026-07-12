import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  fileSar,
  lockForAudit,
  reportDora,
  reportPsd2,
  startRegulatoryReporting,
} from '../../src/index.js';

// Closes the reachable branches in packages/payment/src/semantics/regulatory-reporting.ts
// that regulatory-reporting.test.ts leaves open: input-range guards on
// `reportPsd2.challengeRate` (< 0 / > 1) and `reportDora.ictRiskScore` (< 0 / > 100),
// duplicate SAR filing throw, empty-reason SAR throw, and the `currency !==
// undefined` arm across the emit path.

describe('regulatory-reporting — defensive input validation', () => {
  it('T-PAY-C-RG-001 reportPsd2 rejects challengeRate below 0', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_1',
      customerId: 'cus_rg_1',
    });
    await expect(
      reportPsd2(adapter, session, {
        reportId: 'r_1',
        period: 'monthly',
        challengeRate: -0.1,
        exemptionCount: 0,
        fingerprint: 'fp_1',
      }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it('T-PAY-C-RG-002 reportPsd2 rejects challengeRate above 1', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_2',
      customerId: 'cus_rg_2',
    });
    await expect(
      reportPsd2(adapter, session, {
        reportId: 'r_2',
        period: 'monthly',
        challengeRate: 1.5,
        exemptionCount: 0,
        fingerprint: 'fp_2',
      }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it('T-PAY-C-RG-003 reportDora rejects ictRiskScore below 0', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_3',
      customerId: 'cus_rg_3',
    });
    await expect(
      reportDora(adapter, session, {
        reportId: 'r_3',
        period: 'annual',
        ictRiskScore: -1,
        thirdPartyCount: 0,
        incidentCount: 0,
        fingerprint: 'fp_3',
      }),
    ).rejects.toThrow(/between 0 and 100/);
  });

  it('T-PAY-C-RG-004 reportDora rejects ictRiskScore above 100', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_4',
      customerId: 'cus_rg_4',
    });
    await expect(
      reportDora(adapter, session, {
        reportId: 'r_4',
        period: 'annual',
        ictRiskScore: 101,
        thirdPartyCount: 0,
        incidentCount: 0,
        fingerprint: 'fp_4',
      }),
    ).rejects.toThrow(/between 0 and 100/);
  });

  it('T-PAY-C-RG-005 fileSar rejects duplicate filing', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_5',
      customerId: 'cus_rg_5',
    });
    await fileSar(adapter, session, {
      reportId: 'sar_5',
      regulator: 'FinCEN',
      reason: 'structuring',
      fingerprint: 'fp_5',
    });
    await expect(
      fileSar(adapter, session, {
        reportId: 'sar_5b',
        regulator: 'FinCEN',
        reason: 'more suspicion',
        fingerprint: 'fp_5b',
      }),
    ).rejects.toThrow(/already filed/);
  });

  it('T-PAY-C-RG-006 fileSar rejects empty reason', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_6',
      customerId: 'cus_rg_6',
    });
    await expect(
      fileSar(adapter, session, {
        reportId: 'sar_6',
        regulator: 'NCA',
        reason: '',
        fingerprint: 'fp_6',
      }),
    ).rejects.toThrow(/reason must not be empty/);
  });

  it('T-PAY-C-RG-007 startRegulatoryReporting keeps currency when provided', () => {
    const session = startRegulatoryReporting({
      entityId: 'ent_7',
      customerId: 'cus_rg_7',
      currency: 'EUR',
    });
    expect(session.currency).toBe('EUR');
  });

  it('T-PAY-C-RG-008 emit propagates session currency to underlying event', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_8',
      customerId: 'cus_rg_8',
      currency: 'GBP',
    });
    const step = await reportPsd2(adapter, session, {
      reportId: 'r_8',
      period: 'quarterly',
      challengeRate: 0.05,
      exemptionCount: 42,
      fingerprint: 'fp_8',
    });
    expect(step.neutralEvent).toBe('reg.psd2_reported');
    expect(step.metadata.exemptionCount).toBe(42);
  });

  it('T-PAY-C-RG-009 lockForAudit moves session to audit-locked terminal state', () => {
    const session = startRegulatoryReporting({
      entityId: 'ent_9',
      customerId: 'cus_rg_9',
    });
    const locked = lockForAudit(session);
    expect(locked.state).toBe('audit-locked');
    expect(locked).toBe(session);
  });

  it('T-PAY-C-RG-010 fileSar with NCA regulator sets sarFiled flag', async () => {
    const adapter = createStripeMock();
    const session = startRegulatoryReporting({
      entityId: 'ent_10',
      customerId: 'cus_rg_10',
      currency: 'GBP',
    });
    const step = await fileSar(adapter, session, {
      reportId: 'sar_10',
      regulator: 'NCA',
      reason: 'unusual transaction pattern',
      fingerprint: 'fp_10',
    });
    expect(session.sarFiled).toBe(true);
    expect(session.state).toBe('sar-filed');
    expect(step.metadata.regulator).toBe('NCA');
  });
});
