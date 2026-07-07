/**
 * Policy store end-to-end fidelity spec (policy-store axis: versioning +
 * activation + rollback).
 *
 * Sub-Issue CAR-827 (v1.37-3) AC — the mock adapter drives a full policy
 * store ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across four axes.
 *
 *  1. publishPolicy grows the store's ordered version list and returns
 *     the new version number.
 *  2. publishPolicy with activateOnPublish=true also moves the active
 *     version pointer forward.
 *  3. activatePolicy moves the active version pointer to a specific
 *     stored version.
 *  4. rollbackPolicy moves the active version pointer backwards to an
 *     earlier stored version and is guarded against forward rollback.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handlePolicyStoreRequest,
  validatePolicyStoreRequest,
} from '../src/app/policy-store/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — publish policy', () => {
  it('axis 1: publishPolicy assigns version 1 on empty store', async () => {
    await mock.startPolicyStore({ policyId: 'p1' });
    const result = await mock.publishPolicy({
      policyId: 'p1',
      body: 'p, alice, post, read',
      activateOnPublish: false,
    });
    expect(result.version).toBe(1);
    expect(result.activeVersion).toBe(0);
  });

  it('axis 1: publishPolicy increments version monotonically', async () => {
    await mock.startPolicyStore({ policyId: 'p2' });
    const v1 = await mock.publishPolicy({
      policyId: 'p2',
      body: 'v1',
      activateOnPublish: false,
    });
    const v2 = await mock.publishPolicy({
      policyId: 'p2',
      body: 'v2',
      activateOnPublish: false,
    });
    const v3 = await mock.publishPolicy({
      policyId: 'p2',
      body: 'v3',
      activateOnPublish: false,
    });
    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    expect(v3.version).toBe(3);
  });

  it('axis 1: publishPolicy with activateOnPublish=true moves active pointer forward', async () => {
    await mock.startPolicyStore({ policyId: 'p3' });
    const result = await mock.publishPolicy({
      policyId: 'p3',
      body: 'v1',
      activateOnPublish: true,
    });
    expect(result.activeVersion).toBe(1);
  });

  it('axis 1: publishPolicy without startPolicyStore fails', async () => {
    await expect(
      mock.publishPolicy({
        policyId: 'missing',
        body: 'x',
        activateOnPublish: false,
      }),
    ).rejects.toThrow(/store_session_missing/);
  });

  it('axis 1: publishPolicy after closePolicyStore fails', async () => {
    await mock.startPolicyStore({ policyId: 'p4' });
    await mock.closePolicyStore({ policyId: 'p4' });
    await expect(
      mock.publishPolicy({
        policyId: 'p4',
        body: 'x',
        activateOnPublish: false,
      }),
    ).rejects.toThrow(/store_session_closed/);
  });

  it('axis 1: publishPolicy trace records version + activeVersion', async () => {
    await mock.startPolicyStore({ policyId: 'p5' });
    await mock.publishPolicy({
      policyId: 'p5',
      body: 'v1',
      activateOnPublish: true,
    });
    const trace = mock.traces().find((t) => t.op === 'publishPolicy');
    expect((trace?.detail as { version?: number })?.version).toBe(1);
    expect(
      (trace?.detail as { activeVersion?: number })?.activeVersion,
    ).toBe(1);
  });
});

describe('mock adapter — activate policy', () => {
  it('axis 2: activatePolicy moves pointer to a stored version', async () => {
    await mock.startPolicyStore({ policyId: 'a1' });
    await mock.publishPolicy({
      policyId: 'a1',
      body: 'v1',
      activateOnPublish: false,
    });
    await mock.publishPolicy({
      policyId: 'a1',
      body: 'v2',
      activateOnPublish: false,
    });
    const result = await mock.activatePolicy({
      policyId: 'a1',
      version: 2,
    });
    expect(result.activeVersion).toBe(2);
  });

  it('axis 2: activatePolicy with unknown version fails', async () => {
    await mock.startPolicyStore({ policyId: 'a2' });
    await mock.publishPolicy({
      policyId: 'a2',
      body: 'v1',
      activateOnPublish: false,
    });
    await expect(
      mock.activatePolicy({ policyId: 'a2', version: 999 }),
    ).rejects.toThrow(/store_version_missing/);
  });

  it('axis 2: activatePolicy trace records version transition', async () => {
    await mock.startPolicyStore({ policyId: 'a3' });
    await mock.publishPolicy({
      policyId: 'a3',
      body: 'v1',
      activateOnPublish: true,
    });
    await mock.publishPolicy({
      policyId: 'a3',
      body: 'v2',
      activateOnPublish: false,
    });
    await mock.activatePolicy({ policyId: 'a3', version: 2 });
    const trace = mock.traces().find((t) => t.op === 'activatePolicy');
    expect((trace?.detail as { version?: number })?.version).toBe(2);
    expect(
      (trace?.detail as { activeVersion?: number })?.activeVersion,
    ).toBe(2);
  });
});

describe('mock adapter — rollback policy', () => {
  it('axis 3: rollbackPolicy moves pointer backwards', async () => {
    await mock.startPolicyStore({ policyId: 'r1' });
    await mock.publishPolicy({
      policyId: 'r1',
      body: 'v1',
      activateOnPublish: true,
    });
    await mock.publishPolicy({
      policyId: 'r1',
      body: 'v2',
      activateOnPublish: true,
    });
    const result = await mock.rollbackPolicy({
      policyId: 'r1',
      toVersion: 1,
    });
    expect(result.rolledBackFrom).toBe(2);
    expect(result.rolledBackTo).toBe(1);
    expect(result.activeVersion).toBe(1);
  });

  it('axis 3: rollbackPolicy rejects forward rollback (target >= active)', async () => {
    await mock.startPolicyStore({ policyId: 'r2' });
    await mock.publishPolicy({
      policyId: 'r2',
      body: 'v1',
      activateOnPublish: true,
    });
    await mock.publishPolicy({
      policyId: 'r2',
      body: 'v2',
      activateOnPublish: false,
    });
    await expect(
      mock.rollbackPolicy({ policyId: 'r2', toVersion: 2 }),
    ).rejects.toThrow(/store_rollback_not_backwards/);
  });

  it('axis 3: rollbackPolicy rejects rollback to unknown version', async () => {
    await mock.startPolicyStore({ policyId: 'r3' });
    await mock.publishPolicy({
      policyId: 'r3',
      body: 'v1',
      activateOnPublish: true,
    });
    await expect(
      mock.rollbackPolicy({ policyId: 'r3', toVersion: 999 }),
    ).rejects.toThrow(/store_version_missing/);
  });

  it('axis 3: rollbackPolicy trace records from + to versions', async () => {
    await mock.startPolicyStore({ policyId: 'r4' });
    await mock.publishPolicy({
      policyId: 'r4',
      body: 'v1',
      activateOnPublish: true,
    });
    await mock.publishPolicy({
      policyId: 'r4',
      body: 'v2',
      activateOnPublish: true,
    });
    await mock.rollbackPolicy({ policyId: 'r4', toVersion: 1 });
    const trace = mock.traces().find((t) => t.op === 'rollbackPolicy');
    expect((trace?.detail as { from?: number })?.from).toBe(2);
    expect((trace?.detail as { to?: number })?.to).toBe(1);
  });
});

describe('mock adapter — policy store trace ordering + isolation', () => {
  it('axis 4: trace order matches lifecycle (start → publish → activate → rollback → close)', async () => {
    await mock.startPolicyStore({ policyId: 'ord1' });
    await mock.publishPolicy({
      policyId: 'ord1',
      body: 'v1',
      activateOnPublish: true,
    });
    await mock.publishPolicy({
      policyId: 'ord1',
      body: 'v2',
      activateOnPublish: false,
    });
    await mock.activatePolicy({ policyId: 'ord1', version: 2 });
    await mock.rollbackPolicy({ policyId: 'ord1', toVersion: 1 });
    await mock.closePolicyStore({ policyId: 'ord1' });
    const ops = mock.traces().map((t) => t.op);
    expect(ops).toEqual([
      'startPolicyStore',
      'publishPolicy',
      'publishPolicy',
      'activatePolicy',
      'rollbackPolicy',
      'closePolicyStore',
    ]);
  });

  it('axis 4: separate policyIds do not leak versions', async () => {
    await mock.startPolicyStore({ policyId: 'A' });
    await mock.startPolicyStore({ policyId: 'B' });
    await mock.publishPolicy({
      policyId: 'A',
      body: 'A-v1',
      activateOnPublish: true,
    });
    await mock.publishPolicy({
      policyId: 'A',
      body: 'A-v2',
      activateOnPublish: true,
    });
    const inB = await mock.publishPolicy({
      policyId: 'B',
      body: 'B-v1',
      activateOnPublish: true,
    });
    expect(inB.version).toBe(1);
  });

  it('axis 4: closePolicyStore trace records version count', async () => {
    await mock.startPolicyStore({ policyId: 'ord2' });
    await mock.publishPolicy({
      policyId: 'ord2',
      body: 'v1',
      activateOnPublish: false,
    });
    await mock.publishPolicy({
      policyId: 'ord2',
      body: 'v2',
      activateOnPublish: false,
    });
    await mock.closePolicyStore({ policyId: 'ord2' });
    const trace = mock.traces().find((t) => t.op === 'closePolicyStore');
    expect(
      (trace?.detail as { versionCount?: number })?.versionCount,
    ).toBe(2);
  });
});

describe('policy-store route handler — validation', () => {
  it('validatePolicyStoreRequest requires policyId', () => {
    const res = validatePolicyStoreRequest({ kind: 'publish' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('policyId_required');
  });

  it('validatePolicyStoreRequest requires kind in {publish, activate, rollback}', () => {
    const res = validatePolicyStoreRequest({ kind: 'other', policyId: 'p' });
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(res.errorKind).toBe(
        'kind_must_be_publish_activate_or_rollback',
      );
  });

  it('validatePolicyStoreRequest publish requires body', () => {
    const res = validatePolicyStoreRequest({
      kind: 'publish',
      policyId: 'p',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('body_required');
  });

  it('validatePolicyStoreRequest activate requires version', () => {
    const res = validatePolicyStoreRequest({
      kind: 'activate',
      policyId: 'p',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('version_required');
  });

  it('validatePolicyStoreRequest rollback requires toVersion', () => {
    const res = validatePolicyStoreRequest({
      kind: 'rollback',
      policyId: 'p',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('toVersion_required');
  });

  it('handlePolicyStoreRequest publish then rollback returns rolledBackFrom/To', async () => {
    await mock.startPolicyStore({ policyId: 'h1' });
    await handlePolicyStoreRequest(mock, {
      kind: 'publish',
      policyId: 'h1',
      body: 'v1',
      activateOnPublish: true,
    });
    await handlePolicyStoreRequest(mock, {
      kind: 'publish',
      policyId: 'h1',
      body: 'v2',
      activateOnPublish: true,
    });
    const rb = await handlePolicyStoreRequest(mock, {
      kind: 'rollback',
      policyId: 'h1',
      toVersion: 1,
    });
    expect(rb.ok).toBe(true);
    expect(rb.rolledBackFrom).toBe(2);
    expect(rb.rolledBackTo).toBe(1);
  });

  it('handlePolicyStoreRequest reports errorKind on adapter throw', async () => {
    const res = await handlePolicyStoreRequest(mock, {
      kind: 'publish',
      policyId: 'missing',
      body: 'x',
      activateOnPublish: false,
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('store_session_missing');
  });
});
