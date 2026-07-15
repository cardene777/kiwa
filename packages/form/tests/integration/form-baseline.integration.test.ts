/**
 * integration test — form domain の end-to-end workflow (register → setValue → validate →
 * submit → error 集約) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createFormClient,
  registerField,
  submitForm,
  getFieldError,
  validateSchema,
} from '../../src/index.js';

describe('form integration — register → validate → submit workflow', () => {
  it('T-INT-F-001 signup workflow (3 field register + submit) が onSubmit を trigger する', async () => {
    const client = createFormClient({ provider: 'react-hook-form' });
    registerField(client, { name: 'email', rule: { required: true, pattern: /@/ }, defaultValue: 'a@x' });
    registerField(client, { name: 'password', rule: { required: true, min: 8 }, defaultValue: 'p@ssw0rd' });
    registerField(client, { name: 'age', rule: { min: 13 }, defaultValue: 25 });
    let submittedValues: Record<string, unknown> | null = null;
    const result = await submitForm(client, { onSubmit: (v) => { submittedValues = v; } });
    expect(result.ok).toBe(true);
    expect(submittedValues).toEqual({ email: 'a@x', password: 'p@ssw0rd', age: 25 });
  });

  it('T-INT-F-002 required-missing で submit が onError を trigger する', async () => {
    const client = createFormClient({ provider: 'formik' });
    registerField(client, { name: 'email', rule: { required: true } });
    let caughtErrors: unknown = null;
    const result = await submitForm(client, {
      onSubmit: () => { throw new Error('should not be called'); },
      onError: (errs) => { caughtErrors = errs; },
    });
    expect(result.ok).toBe(false);
    expect(caughtErrors).not.toBeNull();
    expect(getFieldError(client, 'email')?.code).toBe('required');
  });

  it('T-INT-F-003 provider 別 (Zod / RHF) submit で id prefix + listSubmitted 保持', async () => {
    const rhf = createFormClient({ provider: 'react-hook-form' });
    const zod = createFormClient({ provider: 'zod' });
    await rhf.submit({ onSubmit: () => {} });
    await zod.submit({ onSubmit: () => {} });
    expect(rhf.listSubmitted()[0]?.id.startsWith('rhf-')).toBe(true);
    expect(zod.listSubmitted()[0]?.id.startsWith('zod-')).toBe(true);
  });

  it('T-INT-F-004 custom validator が独自 error message を返す', () => {
    const schema = {
      fields: {
        username: { custom: (v: unknown) => (typeof v === 'string' && v === 'admin') ? 'reserved' : null },
      },
    };
    const result = validateSchema(schema, { username: 'admin' }, 'zod');
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.message).toBe('reserved');
    expect(result.errors[0]?.code).toBe('custom');
  });

  it('T-INT-F-005 overrideValues で default を差替え submit', async () => {
    const client = createFormClient({ provider: 'conform', defaultValues: { name: 'default' } });
    let captured = '';
    await submitForm(client, {
      overrideValues: { name: 'overridden' },
      onSubmit: (v) => { captured = String(v.name); },
    });
    expect(captured).toBe('overridden');
  });
});
