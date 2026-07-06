/**
 * License key issue + activation logic. Real Lemon Squeezy license keys
 * emit automatically on order paid for licensed variants and expose
 * activation via `POST /v1/licenses/activate` +
 * `POST /v1/licenses/deactivate`. The dogfood app exposes an explicit
 * `issueLicenseKey` step so tests can drive the issue path deterministically
 * without waiting for the webhook.
 */

import type {
  AppStore,
  LicenseActivation,
  LicenseKeyRecord,
} from './store.js';

/**
 * Per-variant activation limits. Real merchants configure limits per
 * variant — `per-seat` (5 concurrent seats) vs `per-machine` (1 machine)
 * being the two most common shapes.
 */
export interface LicensePolicy {
  /** how many concurrent activations the license allows */
  maxActivations: number;
  /** whether the license binds per machine or per seat */
  bindKind: 'per-machine' | 'per-seat';
}

/**
 * Default policies — variants without an explicit policy get bronze
 * (5 machines) so tests do not need to configure a policy per variant.
 */
export const DEFAULT_POLICY: LicensePolicy = {
  maxActivations: 5,
  bindKind: 'per-machine',
};

/**
 * Issue a license key against a paid order. Idempotent — repeating with
 * the same orderId returns the existing license (mirrors Lemon Squeezy's
 * webhook redelivery semantics).
 */
export function issueLicenseKey(
  store: AppStore,
  input: {
    orderId: string;
    customerId: string;
    variantId: string;
    policy?: LicensePolicy;
    now?: number;
  },
): LicenseKeyRecord {
  const existing = findLicenseByOrder(store, input.orderId);
  if (existing !== undefined) return existing;
  const policy = input.policy ?? DEFAULT_POLICY;
  const id = `lic_${store.licenses.size + 1}_${input.orderId}`;
  const key = generateLicenseKey(input.orderId, input.customerId);
  const now = input.now ?? Date.now();
  const record: LicenseKeyRecord = {
    id,
    key,
    orderId: input.orderId,
    customerId: input.customerId,
    variantId: input.variantId,
    issuedAt: now,
    status: 'active',
    maxActivations: policy.maxActivations,
    activations: [],
  };
  store.licenses.set(id, record);
  const order = store.orders.get(input.orderId);
  if (order !== undefined) order.licenseId = id;
  return record;
}

/**
 * Activate a license key against a machine or seat. Enforces
 * `maxActivations` and returns a `license_limit_reached` error via
 * thrown Error when exceeded (routes catch + classify these).
 */
export function activateLicense(
  store: AppStore,
  input: {
    licenseKey: string;
    machineId: string;
    seatId?: string;
    now?: number;
  },
): LicenseActivation {
  const record = findLicenseByKey(store, input.licenseKey);
  if (record === undefined) {
    throw new Error('license_not_found');
  }
  if (record.status !== 'active') {
    throw new Error(`license_is_${record.status}`);
  }
  const activeCount = record.activations.filter((a) => a.state === 'active').length;
  const duplicate = record.activations.find(
    (a) => a.state === 'active' && a.machineId === input.machineId,
  );
  if (duplicate !== undefined) return duplicate;
  if (activeCount >= record.maxActivations) {
    throw new Error('license_limit_reached');
  }
  const instanceId = `${record.id}_inst_${record.activations.length + 1}`;
  const now = input.now ?? Date.now();
  const activation: LicenseActivation = {
    instanceId,
    machineId: input.machineId,
    activatedAt: now,
    state: 'active',
  };
  if (input.seatId !== undefined) activation.seatId = input.seatId;
  record.activations.push(activation);
  return activation;
}

/**
 * Deactivate a specific activation instance. Idempotent — deactivating
 * an already-revoked instance is a no-op.
 */
export function deactivateLicense(
  store: AppStore,
  input: { licenseKey: string; instanceId: string; now?: number },
): LicenseActivation {
  const record = findLicenseByKey(store, input.licenseKey);
  if (record === undefined) throw new Error('license_not_found');
  const instance = record.activations.find((a) => a.instanceId === input.instanceId);
  if (instance === undefined) throw new Error('license_instance_not_found');
  if (instance.state === 'revoked') return instance;
  instance.state = 'revoked';
  instance.revokedAt = input.now ?? Date.now();
  return instance;
}

/**
 * Revoke a whole license key — used when an order is refunded. Revokes
 * every active activation instance and marks the license as `revoked`.
 */
export function revokeLicense(
  store: AppStore,
  input: { licenseKey: string; now?: number },
): LicenseKeyRecord {
  const record = findLicenseByKey(store, input.licenseKey);
  if (record === undefined) throw new Error('license_not_found');
  if (record.status === 'revoked') return record;
  const now = input.now ?? Date.now();
  for (const activation of record.activations) {
    if (activation.state === 'active') {
      activation.state = 'revoked';
      activation.revokedAt = now;
    }
  }
  record.status = 'revoked';
  return record;
}

function findLicenseByOrder(
  store: AppStore,
  orderId: string,
): LicenseKeyRecord | undefined {
  for (const record of store.licenses.values()) {
    if (record.orderId === orderId) return record;
  }
  return undefined;
}

function findLicenseByKey(
  store: AppStore,
  key: string,
): LicenseKeyRecord | undefined {
  for (const record of store.licenses.values()) {
    if (record.key === key) return record;
  }
  return undefined;
}

/**
 * Generate a stable license key string. Real LS uses uuid-shaped values;
 * the mock uses a deterministic hash of the order id + customer id so
 * tests can assert on exact values.
 */
function generateLicenseKey(orderId: string, customerId: string): string {
  return `LS-${hex(orderId)}-${hex(customerId)}`;
}

function hex(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0').toUpperCase();
}
