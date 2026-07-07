import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  fileSar,
  lockForAudit,
  type PaymentAdapter,
  reportDora,
  reportPci,
  reportPsd2,
  startRegulatoryReporting,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('regulatory-reporting axis — PCI + PSD2 + DORA + AML/KYC + SAR', () => {
  it('startRegulatoryReporting initialises with empty reports', () => {
    const s = startRegulatoryReporting({
      entityId: 'ent_1',
      customerId: 'cus_1',
    });
    expect(s.state).toBe('initial');
    expect(s.reports).toEqual([]);
    expect(s.sarFiled).toBe(false);
  });

  it.each(providers)('$name: reportPci records report and moves state', async ({ make }) => {
    const adapter = make();
    const s = startRegulatoryReporting({
      entityId: 'ent_2',
      customerId: 'cus_2',
    });
    const step = await reportPci(adapter, s, {
      reportId: 'rp_1',
      period: 'quarterly',
      fingerprint: 'fp_pci_1',
      saqLevel: 'A',
    });
    expect(step.neutralEvent).toBe('reg.pci_reported');
    expect(step.metadata.saqLevel).toBe('A');
    expect(step.metadata.period).toBe('quarterly');
    expect(s.state).toBe('pci-reported');
    expect(s.reports).toHaveLength(1);
    expect(s.reports[0]?.regulator).toBe('PCI-SSC');
  });

  it('reportPci supports all SAQ levels', async () => {
    const adapter = createStripeMock();
    const s = startRegulatoryReporting({
      entityId: 'ent_3',
      customerId: 'cus_3',
    });
    const levels = ['A', 'A-EP', 'D'] as const;
    for (const saqLevel of levels) {
      const step = await reportPci(adapter, s, {
        reportId: `rp_${saqLevel}`,
        period: 'annual',
        fingerprint: `fp_${saqLevel}`,
        saqLevel,
      });
      expect(step.metadata.saqLevel).toBe(saqLevel);
    }
    expect(s.reports).toHaveLength(3);
  });

  it.each(providers)('$name: reportPsd2 records EBA submission', async ({ make }) => {
    const adapter = make();
    const s = startRegulatoryReporting({
      entityId: 'ent_p',
      customerId: 'cus_p',
    });
    const step = await reportPsd2(adapter, s, {
      reportId: 'rp_p1',
      period: 'monthly',
      challengeRate: 0.15,
      exemptionCount: 500,
      fingerprint: 'fp_p1',
    });
    expect(step.neutralEvent).toBe('reg.psd2_reported');
    expect(step.metadata.challengeRate).toBe(0.15);
    expect(step.metadata.exemptionCount).toBe(500);
    expect(s.state).toBe('psd2-reported');
    expect(s.reports[0]?.regulator).toBe('EBA');
  });

  it('reportPsd2 rejects challengeRate outside 0-1', async () => {
    const adapter = createStripeMock();
    const s = startRegulatoryReporting({
      entityId: 'ent_pbad',
      customerId: 'cus',
    });
    await expect(
      reportPsd2(adapter, s, {
        reportId: 'rp_bad',
        period: 'monthly',
        challengeRate: -0.1,
        exemptionCount: 0,
        fingerprint: 'x',
      }),
    ).rejects.toThrow(/between 0 and 1/);
    await expect(
      reportPsd2(adapter, s, {
        reportId: 'rp_bad2',
        period: 'monthly',
        challengeRate: 1.5,
        exemptionCount: 0,
        fingerprint: 'x',
      }),
    ).rejects.toThrow(/between 0 and 1/);
  });

  it.each(providers)('$name: reportDora records ESA submission', async ({ make }) => {
    const adapter = make();
    const s = startRegulatoryReporting({
      entityId: 'ent_d',
      customerId: 'cus_d',
    });
    const step = await reportDora(adapter, s, {
      reportId: 'rp_d1',
      period: 'annual',
      ictRiskScore: 65,
      thirdPartyCount: 20,
      incidentCount: 2,
      fingerprint: 'fp_d1',
    });
    expect(step.neutralEvent).toBe('reg.dora_reported');
    expect(step.metadata.ictRiskScore).toBe(65);
    expect(step.metadata.thirdPartyCount).toBe(20);
    expect(step.metadata.incidentCount).toBe(2);
    expect(s.state).toBe('dora-reported');
    expect(s.reports[0]?.regulator).toBe('ESA');
  });

  it('reportDora rejects ictRiskScore outside 0-100', async () => {
    const adapter = createStripeMock();
    const s = startRegulatoryReporting({
      entityId: 'ent_dbad',
      customerId: 'cus',
    });
    await expect(
      reportDora(adapter, s, {
        reportId: 'x',
        period: 'annual',
        ictRiskScore: -5,
        thirdPartyCount: 0,
        incidentCount: 0,
        fingerprint: 'x',
      }),
    ).rejects.toThrow(/between 0 and 100/);
    await expect(
      reportDora(adapter, s, {
        reportId: 'x',
        period: 'annual',
        ictRiskScore: 105,
        thirdPartyCount: 0,
        incidentCount: 0,
        fingerprint: 'x',
      }),
    ).rejects.toThrow(/between 0 and 100/);
  });

  it.each(providers)('$name: fileSar files with FinCEN and marks state', async ({ make }) => {
    const adapter = make();
    const s = startRegulatoryReporting({
      entityId: 'ent_s',
      customerId: 'cus_s',
    });
    const step = await fileSar(adapter, s, {
      reportId: 'sar_1',
      regulator: 'FinCEN',
      reason: 'unusual pattern',
      fingerprint: 'sar_fp',
    });
    expect(step.neutralEvent).toBe('reg.sar_filed');
    expect(step.metadata.regulator).toBe('FinCEN');
    expect(step.metadata.reason).toBe('unusual pattern');
    expect(s.sarFiled).toBe(true);
    expect(s.state).toBe('sar-filed');
    expect(s.reports[0]?.regulator).toBe('FinCEN');
  });

  it('fileSar supports NCA', async () => {
    const adapter = createStripeMock();
    const s = startRegulatoryReporting({
      entityId: 'ent_nca',
      customerId: 'cus_nca',
    });
    const step = await fileSar(adapter, s, {
      reportId: 'sar_2',
      regulator: 'NCA',
      reason: 'AML flag',
      fingerprint: 'x',
    });
    expect(step.metadata.regulator).toBe('NCA');
    expect(s.reports[0]?.regulator).toBe('NCA');
  });

  it('fileSar rejects duplicate filing', async () => {
    const adapter = createStripeMock();
    const s = startRegulatoryReporting({
      entityId: 'ent_dup',
      customerId: 'cus',
    });
    await fileSar(adapter, s, {
      reportId: 'sar_x',
      regulator: 'FinCEN',
      reason: 'first',
      fingerprint: 'x',
    });
    await expect(
      fileSar(adapter, s, {
        reportId: 'sar_x2',
        regulator: 'FinCEN',
        reason: 'second',
        fingerprint: 'x',
      }),
    ).rejects.toThrow(/already filed/);
  });

  it('fileSar rejects empty reason', async () => {
    const adapter = createStripeMock();
    const s = startRegulatoryReporting({
      entityId: 'ent_re',
      customerId: 'cus',
    });
    await expect(
      fileSar(adapter, s, {
        reportId: 'x',
        regulator: 'FinCEN',
        reason: '',
        fingerprint: 'x',
      }),
    ).rejects.toThrow(/must not be empty/);
  });

  it('lockForAudit moves to audit-locked', () => {
    const s = startRegulatoryReporting({
      entityId: 'ent_lk',
      customerId: 'cus_lk',
    });
    lockForAudit(s);
    expect(s.state).toBe('audit-locked');
  });

  it('multiple report kinds accumulate correctly', async () => {
    const adapter = createStripeMock();
    const s = startRegulatoryReporting({
      entityId: 'ent_multi',
      customerId: 'cus_multi',
    });
    await reportPci(adapter, s, {
      reportId: 'p1',
      period: 'quarterly',
      fingerprint: 'x',
      saqLevel: 'A',
    });
    await reportPsd2(adapter, s, {
      reportId: 'p2',
      period: 'monthly',
      challengeRate: 0.1,
      exemptionCount: 100,
      fingerprint: 'x',
    });
    await reportDora(adapter, s, {
      reportId: 'p3',
      period: 'annual',
      ictRiskScore: 50,
      thirdPartyCount: 5,
      incidentCount: 0,
      fingerprint: 'x',
    });
    await fileSar(adapter, s, {
      reportId: 'p4',
      regulator: 'FinCEN',
      reason: 'ok',
      fingerprint: 'x',
    });
    expect(s.reports).toHaveLength(4);
    expect(s.reports.map((r) => r.regulator)).toEqual([
      'PCI-SSC',
      'EBA',
      'ESA',
      'FinCEN',
    ]);
  });

  it('history captures all events in order', async () => {
    const adapter = createStripeMock();
    const s = startRegulatoryReporting({
      entityId: 'ent_h',
      customerId: 'cus_h',
    });
    await reportPci(adapter, s, {
      reportId: 'h1',
      period: 'quarterly',
      fingerprint: 'x',
      saqLevel: 'D',
    });
    await reportDora(adapter, s, {
      reportId: 'h2',
      period: 'annual',
      ictRiskScore: 40,
      thirdPartyCount: 3,
      incidentCount: 1,
      fingerprint: 'x',
    });
    await fileSar(adapter, s, {
      reportId: 'h3',
      regulator: 'NCA',
      reason: 'audit',
      fingerprint: 'x',
    });
    expect(s.history).toHaveLength(3);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'reg.pci_reported',
      'reg.dora_reported',
      'reg.sar_filed',
    ]);
  });

  it('all periods accepted', async () => {
    const adapter = createStripeMock();
    const s = startRegulatoryReporting({
      entityId: 'ent_p',
      customerId: 'cus',
    });
    const periods = ['monthly', 'quarterly', 'annual', 'on-demand'] as const;
    for (const period of periods) {
      const step = await reportPci(adapter, s, {
        reportId: `${period}_r`,
        period,
        fingerprint: 'x',
        saqLevel: 'A',
      });
      expect(step.metadata.period).toBe(period);
    }
  });
});
