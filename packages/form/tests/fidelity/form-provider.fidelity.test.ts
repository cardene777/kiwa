/**
 * fidelity test — createFormClient (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で register / validate / submit / provider 差 / error 経路の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createFormClient,
  registerField,
  validateSchema,
  validateAsync,
  createFieldArray,
  validateDependentFields,
  retryWithBackoff,
} from '../../src/index.js';

function referenceForm() {
  const values: Record<string, unknown> = {};
  return {
    set(name: string, value: unknown) { values[name] = value; },
    submit() { return { ok: true, values: { ...values } }; },
    listValues() { return { ...values }; },
  };
}

describe('form client fidelity vs reference impl', () => {
  it('setValue → getValues = reference impl と一致', async () => {
    const mock = createFormClient({ provider: 'react-hook-form' });
    const real = referenceForm();
    mock.setValue('email', 'a@x');
    real.set('email', 'a@x');
    const result = await assertFidelity({
      mockFn: async () => mock.getValues().email,
      realFn: async () => real.listValues().email,
      cases: [{ name: 'set 1 value', args: [] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('複数 registerField で schema.fields が全て保持される', () => {
    const mock = createFormClient({ provider: 'zod' });
    for (let i = 0; i < 3; i++) {
      registerField(mock, { name: `f${i}`, rule: { required: true } });
    }
    expect(Object.keys(mock.getSchema().fields).length).toBe(3);
  });

  it('validateSchema が required missing で error を返す', () => {
    const schema = { fields: { name: { required: true } } };
    const result = validateSchema(schema, {}, 'zod');
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.field).toBe('name');
    expect(result.errors[0]?.code).toBe('required');
  });

  it('provider 別 submit で id prefix が異なる', async () => {
    const rhf = createFormClient({ provider: 'react-hook-form' });
    const fmk = createFormClient({ provider: 'formik' });
    const cfm = createFormClient({ provider: 'conform' });
    const r1 = await rhf.submit({ onSubmit: () => {} });
    const r2 = await fmk.submit({ onSubmit: () => {} });
    const r3 = await cfm.submit({ onSubmit: () => {} });
    expect(r1.id.startsWith('rhf-')).toBe(true);
    expect(r2.id.startsWith('fmk-')).toBe(true);
    expect(r3.id.startsWith('cfm-')).toBe(true);
  });

  it('clear で listSubmitted + lastErrors が空になる', async () => {
    const client = createFormClient({ provider: 'react-hook-form' });
    registerField(client, { name: 'email', rule: { required: true } });
    await client.submit({ onSubmit: () => {} });
    expect(client.listSubmitted().length).toBe(1);
    expect(client.getLastErrors().length).toBe(1);
    client.clear();
    expect(client.listSubmitted().length).toBe(0);
    expect(client.getLastErrors().length).toBe(0);
  });

  // v2.1 追加 5 case
  it('v2.1 validateAsync = parallel で 2 field 検証', async () => {
    const result = await validateAsync(
      { email: 'a@x', password: 'short' },
      {
        email: async (v) => (typeof v === 'string' && v.includes('@') ? null : 'invalid email'),
        password: async (v) => (typeof v === 'string' && v.length >= 8 ? null : 'too short'),
      },
      { parallel: true },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe('too short');
    expect(result.errors.email).toBeUndefined();
  });

  it('v2.1 fieldArray append + remove で items 変化', () => {
    const arr = createFieldArray<{ name: string }>([{ name: 'a' }]);
    arr.append({ name: 'b' });
    arr.append({ name: 'c' });
    expect(arr.length()).toBe(3);
    arr.remove(1);
    expect(arr.items().map((i) => i.name)).toEqual(['a', 'c']);
  });

  it('v2.1 fieldArray move で順序入替', () => {
    const arr = createFieldArray<string>(['a', 'b', 'c']);
    arr.move(0, 2);
    expect(arr.items()).toEqual(['b', 'c', 'a']);
  });

  it('v2.1 validateDependentFields = country=US なら zip 必須', () => {
    const result = validateDependentFields(
      { country: 'US', zip: '' },
      [
        {
          field: 'zip',
          dependsOn: 'country',
          when: (c) => c === 'US',
          validator: (v) => (typeof v === 'string' && v.length > 0 ? null : 'zip required for US'),
        },
      ],
    );
    expect(result.valid).toBe(false);
    expect(result.triggered).toEqual(['zip']);
    expect(result.errors.zip).toBe('zip required for US');
  });

  it('v2.1 retryWithBackoff 3 attempt', async () => {
    let n = 0;
    const r = await retryWithBackoff(async () => {
      n += 1;
      if (n < 3) throw new Error('retry');
      return 'ok';
    }, { maxAttempts: 5, initialDelayMs: 1 });
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(3);
  });
});
