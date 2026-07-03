import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { FormCTAdapter } from '../src/adapters/interface.js';
import {
  EXPECTED_FIELD_COUNTS,
  mountAllForms,
  totalFormCount,
} from '../src/flows/form-flows.js';
import { FORM_KINDS, FORM_SPECS } from '../src/forms/index.js';

let adapter: FormCTAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-form-ct — mount axis (all 5 form patterns)', () => {
  it('T-DFFC-MNT-001 mountAllForms returns 5 summaries', async () => {
    const mounts = await mountAllForms(adapter);
    expect(mounts).toHaveLength(totalFormCount());
    expect(mounts).toHaveLength(5);
  });

  it('T-DFFC-MNT-002 every summary has hasFormElement=true', async () => {
    const mounts = await mountAllForms(adapter);
    for (const m of mounts) {
      expect(m.hasFormElement, `${m.kind} has <form>`).toBe(true);
    }
  });

  it('T-DFFC-MNT-003 field counts match EXPECTED_FIELD_COUNTS per form kind', async () => {
    const mounts = await mountAllForms(adapter);
    for (const m of mounts) {
      expect(
        m.fieldCount,
        `${m.kind} field count`,
      ).toBe(EXPECTED_FIELD_COUNTS[m.kind]);
    }
  });

  it('T-DFFC-MNT-004 submitButtonLabel is non-empty for every form', async () => {
    const mounts = await mountAllForms(adapter);
    for (const m of mounts) {
      expect(m.submitButtonLabel, `${m.kind} submit label`).not.toBe('');
    }
  });

  it('T-DFFC-MNT-005 mount trace records ok=true 5 times', async () => {
    await mountAllForms(adapter);
    const mountTraces = adapter.traces().filter((t) => t.op === 'mount');
    expect(mountTraces).toHaveLength(5);
    expect(mountTraces.every((t) => t.ok)).toBe(true);
  });

  it('T-DFFC-MNT-006 metrics.mountInvocations equals mount trace count', async () => {
    await mountAllForms(adapter);
    const mountTraces = adapter.traces().filter((t) => t.op === 'mount');
    expect(adapter.metrics().mountInvocations).toBe(mountTraces.length);
  });

  it('T-DFFC-MNT-007 mount summary formId echoes the input args.formId', async () => {
    for (const kind of FORM_KINDS) {
      const args = FORM_SPECS[kind].mountArgs();
      const summary = await adapter.mount(kind, args);
      expect(summary.formId, `${kind} formId`).toBe(args.formId);
    }
  });

  it('T-DFFC-MNT-008 mounting the same kind twice returns coherent field counts', async () => {
    const first = await adapter.mount('login', FORM_SPECS.login.mountArgs());
    const second = await adapter.mount('login', FORM_SPECS.login.submitArgs());
    expect(second.fieldCount).toBe(first.fieldCount);
  });
});
