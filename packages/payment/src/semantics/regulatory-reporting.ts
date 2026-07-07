import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Regulatory reporting axis — PCI DSS + PSD2 SCA + DORA (Digital Operational
 * Resilience Act) + AML/KYC + SAR (Suspicious Activity Report). Real
 * payment processors submit periodic reports to regulators: PCI DSS to
 * card networks, PSD2 to EBA (European Banking Authority), DORA to
 * competent authorities under the ESAs, and SAR to FinCEN (US) / NCA (UK)
 * on demand when suspicious activity is detected.
 */
export type RegulatoryReportingState =
  | 'initial'
  | 'pci-reported'
  | 'psd2-reported'
  | 'dora-reported'
  | 'sar-filed'
  | 'audit-locked';

export type Regulator = 'PCI-SSC' | 'EBA' | 'ESA' | 'FinCEN' | 'NCA';
export type ReportPeriod = 'monthly' | 'quarterly' | 'annual' | 'on-demand';

export interface ReportRecord {
  reportId: string;
  regulator: Regulator;
  period: ReportPeriod;
  submittedAt: number;
  fingerprint: string;
}

export interface RegulatoryReportingSession {
  entityId: string;
  customerId: string;
  currency?: string;
  reports: ReportRecord[];
  sarFiled: boolean;
  state: RegulatoryReportingState;
  history: AxisStep<RegulatoryReportingState>[];
}

/**
 * Start a regulatory reporting session for an entity (merchant / issuer).
 */
export function startRegulatoryReporting(input: {
  entityId: string;
  customerId: string;
  currency?: string;
}): RegulatoryReportingSession {
  const session: RegulatoryReportingSession = {
    entityId: input.entityId,
    customerId: input.customerId,
    reports: [],
    sarFiled: false,
    state: 'initial',
    history: [],
  };
  if (input.currency !== undefined) session.currency = input.currency;
  return session;
}

/**
 * Submit a PCI DSS compliance report — attestation of Section 3.2 (do
 * not store sensitive authentication data after authorisation).
 */
export async function reportPci(
  adapter: PaymentAdapter,
  session: RegulatoryReportingSession,
  input: { reportId: string; period: ReportPeriod; fingerprint: string; saqLevel: 'A' | 'A-EP' | 'D' },
): Promise<AxisStep<RegulatoryReportingState>> {
  const record: ReportRecord = {
    reportId: input.reportId,
    regulator: 'PCI-SSC',
    period: input.period,
    submittedAt: Date.now(),
    fingerprint: input.fingerprint,
  };
  session.reports.push(record);
  session.state = 'pci-reported';
  return emit(adapter, session, 'reg.pci_reported', {
    reportId: input.reportId,
    period: input.period,
    saqLevel: input.saqLevel,
    fingerprint: input.fingerprint,
  });
}

/**
 * Submit a PSD2 SCA (Strong Customer Authentication) compliance report to
 * the EBA. Includes exemption count + challenge rate.
 */
export async function reportPsd2(
  adapter: PaymentAdapter,
  session: RegulatoryReportingSession,
  input: {
    reportId: string;
    period: ReportPeriod;
    challengeRate: number;
    exemptionCount: number;
    fingerprint: string;
  },
): Promise<AxisStep<RegulatoryReportingState>> {
  if (input.challengeRate < 0 || input.challengeRate > 1) {
    throw new Error('reportPsd2: challengeRate must be between 0 and 1');
  }
  const record: ReportRecord = {
    reportId: input.reportId,
    regulator: 'EBA',
    period: input.period,
    submittedAt: Date.now(),
    fingerprint: input.fingerprint,
  };
  session.reports.push(record);
  session.state = 'psd2-reported';
  return emit(adapter, session, 'reg.psd2_reported', {
    reportId: input.reportId,
    period: input.period,
    challengeRate: input.challengeRate,
    exemptionCount: input.exemptionCount,
  });
}

/**
 * Submit a DORA (Digital Operational Resilience Act) report — ICT risk
 * management self-assessment + third-party register.
 */
export async function reportDora(
  adapter: PaymentAdapter,
  session: RegulatoryReportingSession,
  input: {
    reportId: string;
    period: ReportPeriod;
    ictRiskScore: number;
    thirdPartyCount: number;
    incidentCount: number;
    fingerprint: string;
  },
): Promise<AxisStep<RegulatoryReportingState>> {
  if (input.ictRiskScore < 0 || input.ictRiskScore > 100) {
    throw new Error('reportDora: ictRiskScore must be between 0 and 100');
  }
  const record: ReportRecord = {
    reportId: input.reportId,
    regulator: 'ESA',
    period: input.period,
    submittedAt: Date.now(),
    fingerprint: input.fingerprint,
  };
  session.reports.push(record);
  session.state = 'dora-reported';
  return emit(adapter, session, 'reg.dora_reported', {
    reportId: input.reportId,
    period: input.period,
    ictRiskScore: input.ictRiskScore,
    thirdPartyCount: input.thirdPartyCount,
    incidentCount: input.incidentCount,
  });
}

/**
 * File a SAR (Suspicious Activity Report) with FinCEN / NCA. Terminal-ish
 * — a filed SAR is not deletable, so the session enters `sar-filed` state
 * and can only be moved to `audit-locked` afterwards.
 */
export async function fileSar(
  adapter: PaymentAdapter,
  session: RegulatoryReportingSession,
  input: {
    reportId: string;
    regulator: 'FinCEN' | 'NCA';
    reason: string;
    fingerprint: string;
  },
): Promise<AxisStep<RegulatoryReportingState>> {
  if (session.sarFiled) {
    throw new Error('fileSar: SAR already filed for this session');
  }
  if (input.reason.length === 0) {
    throw new Error('fileSar: reason must not be empty');
  }
  const record: ReportRecord = {
    reportId: input.reportId,
    regulator: input.regulator,
    period: 'on-demand',
    submittedAt: Date.now(),
    fingerprint: input.fingerprint,
  };
  session.reports.push(record);
  session.sarFiled = true;
  session.state = 'sar-filed';
  return emit(adapter, session, 'reg.sar_filed', {
    reportId: input.reportId,
    regulator: input.regulator,
    reason: input.reason,
    fingerprint: input.fingerprint,
  });
}

/**
 * Lock the session for audit — no further reports accepted.
 */
export function lockForAudit(session: RegulatoryReportingSession): RegulatoryReportingSession {
  session.state = 'audit-locked';
  return session;
}

async function emit(
  adapter: PaymentAdapter,
  session: RegulatoryReportingSession,
  neutral:
    | 'reg.pci_reported'
    | 'reg.psd2_reported'
    | 'reg.dora_reported'
    | 'reg.sar_filed',
  extra: Record<string, string | number | boolean>,
): Promise<AxisStep<RegulatoryReportingState>> {
  const providerEvent = providerEventName(adapter.provider, neutral);
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    ...(session.currency !== undefined ? { currency: session.currency } : {}),
    customerId: session.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<RegulatoryReportingState> = {
    neutralEvent: neutral,
    providerEvent,
    state: session.state,
    amountCents: 0,
    metadata: {
      entityId: session.entityId,
      customerId: session.customerId,
      ...extra,
    },
  };
  session.history.push(step);
  return step;
}
