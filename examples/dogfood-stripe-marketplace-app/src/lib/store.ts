/**
 * Framework-agnostic in-memory store for the marketplace domain objects.
 *
 * The mock runtime persists Connect accounts, destination charges, transfers,
 * tax reports, and emitted webhook events here so the route handlers can stay
 * stateless and the tests can boot a fresh isolated runtime per case.
 */

import type {
  ChargeResult,
  MarketplaceAccount,
  MarketplaceWebhookEvent,
  TaxReportResult,
  TransferResult,
} from '../adapters/interface.js';

export interface MarketplaceStore {
  persistAccount(account: MarketplaceAccount): void;
  getAccount(id: string): MarketplaceAccount | null;
  listAccounts(): MarketplaceAccount[];

  persistCharge(charge: ChargeResult): void;
  getCharge(id: string): ChargeResult | null;
  listCharges(): ChargeResult[];

  persistTransfer(transfer: TransferResult): void;
  getTransfer(id: string): TransferResult | null;
  listTransfers(): TransferResult[];

  persistTaxReport(report: TaxReportResult): void;
  getTaxReport(id: string): TaxReportResult | null;
  listTaxReports(): TaxReportResult[];

  recordEvent(event: MarketplaceWebhookEvent): void;
  eventsEmitted(): MarketplaceWebhookEvent[];

  reset(): void;
}

/**
 * Build a fresh in-memory marketplace store. Tests create one runtime per
 * case and call `reset()` in `afterEach` so no state bleeds across cases.
 */
export function createMarketplaceStore(): MarketplaceStore {
  const accounts = new Map<string, MarketplaceAccount>();
  const charges = new Map<string, ChargeResult>();
  const transfers = new Map<string, TransferResult>();
  const taxReports = new Map<string, TaxReportResult>();
  const events: MarketplaceWebhookEvent[] = [];

  return {
    persistAccount(account) {
      accounts.set(account.id, cloneAccount(account));
    },
    getAccount(id) {
      const account = accounts.get(id);
      return account ? cloneAccount(account) : null;
    },
    listAccounts() {
      return Array.from(accounts.values(), cloneAccount);
    },
    persistCharge(charge) {
      charges.set(charge.id, cloneCharge(charge));
    },
    getCharge(id) {
      const charge = charges.get(id);
      return charge ? cloneCharge(charge) : null;
    },
    listCharges() {
      return Array.from(charges.values(), cloneCharge);
    },
    persistTransfer(transfer) {
      transfers.set(transfer.id, { ...transfer });
    },
    getTransfer(id) {
      const transfer = transfers.get(id);
      return transfer ? { ...transfer } : null;
    },
    listTransfers() {
      return Array.from(transfers.values(), (transfer) => ({ ...transfer }));
    },
    persistTaxReport(report) {
      taxReports.set(report.id, { ...report });
    },
    getTaxReport(id) {
      const report = taxReports.get(id);
      return report ? { ...report } : null;
    },
    listTaxReports() {
      return Array.from(taxReports.values(), (report) => ({ ...report }));
    },
    recordEvent(event) {
      const entry: MarketplaceWebhookEvent = {
        ...event,
        ...(event.detail !== undefined ? { detail: { ...event.detail } } : {}),
      };
      events.push(entry);
    },
    eventsEmitted() {
      return events.map((event) => ({
        ...event,
        ...(event.detail !== undefined ? { detail: { ...event.detail } } : {}),
      }));
    },
    reset() {
      accounts.clear();
      charges.clear();
      transfers.clear();
      taxReports.clear();
      events.length = 0;
    },
  };
}

function cloneAccount(account: MarketplaceAccount): MarketplaceAccount {
  return {
    ...account,
    capabilities: { ...account.capabilities },
  };
}

function cloneCharge(charge: ChargeResult): ChargeResult {
  return {
    ...charge,
    transferData: { ...charge.transferData },
  };
}
