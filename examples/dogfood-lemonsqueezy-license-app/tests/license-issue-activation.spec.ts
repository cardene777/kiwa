/**
 * License key issue + activation lifecycle. Exercises the per-machine
 * and per-seat activation caps, idempotent issue by orderId, revoke on
 * full refund, and stable error kinds surfaced by the license route.
 */

import { describe, expect, it } from 'vitest';
import {
  makeMockAdapter,
  makeLicenseRoute,
  createStore,
  activateLicense,
  deactivateLicense,
  issueLicenseKey,
  revokeLicense,
  LICENSE_DEFAULT_POLICY,
} from '../src/index.js';

function seedPaidOrder(store: ReturnType<typeof createStore>, id: string, amount = 9900) {
  store.orders.set(id, {
    id,
    customerId: `cust_${id}`,
    variantId: `var_${id}`,
    amountCents: amount,
    currency: 'USD',
    paidAt: 1_700_000_000_000,
    productKind: 'license',
    state: 'paid',
  });
}

describe('license — issue + activate', () => {
  it('issues a license key against a paid order', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_1');
    const license = issueLicenseKey(store, {
      orderId: 'ord_1',
      customerId: 'cust_ord_1',
      variantId: 'var_ord_1',
      now: 1_700_000_100_000,
    });
    expect(license.status).toBe('active');
    expect(license.key).toMatch(/^LS-[0-9A-F]{8}-[0-9A-F]{8}$/);
    expect(license.orderId).toBe('ord_1');
    expect(store.orders.get('ord_1')?.licenseId).toBe(license.id);
  });

  it('issue is idempotent by orderId (webhook redelivery safe)', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_2');
    const first = issueLicenseKey(store, {
      orderId: 'ord_2',
      customerId: 'cust_ord_2',
      variantId: 'var_ord_2',
    });
    const second = issueLicenseKey(store, {
      orderId: 'ord_2',
      customerId: 'cust_ord_2',
      variantId: 'var_ord_2',
    });
    expect(second.id).toBe(first.id);
    expect(store.licenses.size).toBe(1);
  });

  it('activates a license against a machine and reserves an activation slot', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_3');
    const license = issueLicenseKey(store, {
      orderId: 'ord_3',
      customerId: 'cust_ord_3',
      variantId: 'var_ord_3',
    });
    const activation = activateLicense(store, {
      licenseKey: license.key,
      machineId: 'mac-01',
    });
    expect(activation.state).toBe('active');
    const licenseAfter = store.licenses.get(license.id);
    expect(licenseAfter?.activations.length).toBe(1);
  });

  it('duplicate activation for the same machine returns the existing instance', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_4');
    const license = issueLicenseKey(store, {
      orderId: 'ord_4',
      customerId: 'cust_ord_4',
      variantId: 'var_ord_4',
    });
    const first = activateLicense(store, { licenseKey: license.key, machineId: 'mac-dup' });
    const second = activateLicense(store, { licenseKey: license.key, machineId: 'mac-dup' });
    expect(second.instanceId).toBe(first.instanceId);
    expect(store.licenses.get(license.id)?.activations.length).toBe(1);
  });

  it('enforces maxActivations (per-machine cap)', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_5');
    const license = issueLicenseKey(store, {
      orderId: 'ord_5',
      customerId: 'cust_ord_5',
      variantId: 'var_ord_5',
    });
    for (let i = 0; i < LICENSE_DEFAULT_POLICY.maxActivations; i += 1) {
      activateLicense(store, { licenseKey: license.key, machineId: `mac-${i}` });
    }
    expect(() =>
      activateLicense(store, { licenseKey: license.key, machineId: 'mac-over' }),
    ).toThrow('license_limit_reached');
  });

  it('deactivate frees a slot so another machine can activate', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_6');
    const license = issueLicenseKey(store, {
      orderId: 'ord_6',
      customerId: 'cust_ord_6',
      variantId: 'var_ord_6',
      policy: { maxActivations: 2, bindKind: 'per-machine' },
    });
    activateLicense(store, { licenseKey: license.key, machineId: 'mac-a' });
    const activationB = activateLicense(store, {
      licenseKey: license.key,
      machineId: 'mac-b',
    });
    expect(() =>
      activateLicense(store, { licenseKey: license.key, machineId: 'mac-c' }),
    ).toThrow('license_limit_reached');
    deactivateLicense(store, {
      licenseKey: license.key,
      instanceId: activationB.instanceId,
    });
    const activationC = activateLicense(store, {
      licenseKey: license.key,
      machineId: 'mac-c',
    });
    expect(activationC.state).toBe('active');
  });

  it('deactivate is idempotent — repeating on a revoked instance is a no-op', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_7');
    const license = issueLicenseKey(store, {
      orderId: 'ord_7',
      customerId: 'cust_ord_7',
      variantId: 'var_ord_7',
    });
    const inst = activateLicense(store, { licenseKey: license.key, machineId: 'mac-idem' });
    deactivateLicense(store, { licenseKey: license.key, instanceId: inst.instanceId });
    const again = deactivateLicense(store, {
      licenseKey: license.key,
      instanceId: inst.instanceId,
    });
    expect(again.state).toBe('revoked');
  });

  it('deactivate throws license_instance_not_found for unknown instance id', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_8');
    const license = issueLicenseKey(store, {
      orderId: 'ord_8',
      customerId: 'cust_ord_8',
      variantId: 'var_ord_8',
    });
    expect(() =>
      deactivateLicense(store, { licenseKey: license.key, instanceId: 'nope' }),
    ).toThrow('license_instance_not_found');
  });

  it('activateLicense throws license_not_found for an unknown key', () => {
    const store = createStore();
    expect(() =>
      activateLicense(store, { licenseKey: 'LS-BADBADBA-DEADBEEF', machineId: 'mac' }),
    ).toThrow('license_not_found');
  });

  it('revokeLicense flips status + revokes every active instance', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_9');
    const license = issueLicenseKey(store, {
      orderId: 'ord_9',
      customerId: 'cust_ord_9',
      variantId: 'var_ord_9',
    });
    activateLicense(store, { licenseKey: license.key, machineId: 'mac-x' });
    activateLicense(store, { licenseKey: license.key, machineId: 'mac-y' });
    revokeLicense(store, { licenseKey: license.key, now: 1_700_000_500_000 });
    const record = store.licenses.get(license.id);
    expect(record?.status).toBe('revoked');
    expect(record?.activations.every((a) => a.state === 'revoked')).toBe(true);
  });

  it('activating after revoke throws license_is_revoked', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_10');
    const license = issueLicenseKey(store, {
      orderId: 'ord_10',
      customerId: 'cust_ord_10',
      variantId: 'var_ord_10',
    });
    revokeLicense(store, { licenseKey: license.key });
    expect(() =>
      activateLicense(store, { licenseKey: license.key, machineId: 'mac-late' }),
    ).toThrow('license_is_revoked');
  });

  it('per-seat activation records seatId alongside machineId', () => {
    const store = createStore();
    seedPaidOrder(store, 'ord_11');
    const license = issueLicenseKey(store, {
      orderId: 'ord_11',
      customerId: 'cust_ord_11',
      variantId: 'var_ord_11',
      policy: { maxActivations: 3, bindKind: 'per-seat' },
    });
    const activation = activateLicense(store, {
      licenseKey: license.key,
      machineId: 'mac-seat',
      seatId: 'seat-01',
    });
    expect(activation.seatId).toBe('seat-01');
  });
});

describe('license route — HTTP surface', () => {
  it('route returns 200 body for issue', async () => {
    const { adapter, store } = makeMockAdapter();
    seedPaidOrder(store, 'ord_r1');
    const route = makeLicenseRoute(adapter);
    const result = await route('issue', {
      orderId: 'ord_r1',
      customerId: 'cust_ord_r1',
      variantId: 'var_ord_r1',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it('route returns 404 kind license_not_found for unknown activate key', async () => {
    const { adapter } = makeMockAdapter();
    const route = makeLicenseRoute(adapter);
    const result = await route('activate', {
      licenseKey: 'LS-NOPE-NOPE',
      machineId: 'mac',
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.status).toBe(404);
      expect(result.body.kind).toBe('license_not_found');
    }
  });

  it('route returns 409 license_limit_reached when cap exceeded', async () => {
    const { adapter, store } = makeMockAdapter();
    seedPaidOrder(store, 'ord_r2');
    await adapter.issueLicenseKey({
      orderId: 'ord_r2',
      customerId: 'cust_ord_r2',
      variantId: 'var_ord_r2',
      maxActivations: 1,
    });
    const license = Array.from(store.licenses.values())[0]!;
    await adapter.activateLicense({ licenseKey: license.key, machineId: 'mac-1' });
    const route = makeLicenseRoute(adapter);
    const result = await route('activate', { licenseKey: license.key, machineId: 'mac-2' });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.status).toBe(409);
      expect(result.body.kind).toBe('license_limit_reached');
    }
  });

  it('route returns 400 unknown_action for garbage action', async () => {
    const { adapter } = makeMockAdapter();
    const route = makeLicenseRoute(adapter);
    const result = await route(
      'bogus' as unknown as 'issue',
      { orderId: 'ord', customerId: 'cust', variantId: 'var' },
    );
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.body.kind).toBe('unknown_action');
  });
});
