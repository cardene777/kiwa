/**
 * fidelity test — createFormClient (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で register / validate / submit / provider 差 / error 経路の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createFormClient, registerField, validateSchema } from '../../src/index.js';

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
});
