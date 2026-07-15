/**
 * skill test — form skill が主要 API 5 種 (createFormClient / validateSchema / submitForm /
 * registerField / getFieldError) を全て公開している + 4 provider 別に動作することを assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createFormClient,
  validateSchema,
  submitForm,
  registerField,
  getFieldError,
} from '../../src/index.js';

describe('form skill assertions', () => {
  it('createFormClient を 4 provider (react-hook-form/zod/formik/conform) 全てで instantiate 可能', () => {
    for (const provider of ['react-hook-form', 'zod', 'formik', 'conform'] as const) {
      const client = createFormClient({ provider });
      expect(client.provider).toBe(provider);
    }
  });

  it('validateSchema が 4 種 rule (required/min/max/pattern) 全てで error 判定', () => {
    const schema = {
      fields: {
        req: { required: true },
        short: { min: 5 },
        long: { max: 3 },
        pat: { pattern: /^abc$/ },
      },
    };
    const result = validateSchema(schema, { short: 'a', long: 'abcdef', pat: 'xyz' }, 'zod');
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'required')).toBe(true);
    expect(result.errors.some((e) => e.code === 'min')).toBe(true);
    expect(result.errors.some((e) => e.code === 'max')).toBe(true);
    expect(result.errors.some((e) => e.code === 'pattern')).toBe(true);
  });

  it('submitForm helper で overrideValues が反映される', async () => {
    const client = createFormClient({ provider: 'formik' });
    registerField(client, { name: 'email', defaultValue: 'a@x' });
    let captured: Record<string, unknown> = {};
    await submitForm(client, {
      overrideValues: { email: 'b@x' },
      onSubmit: (values) => { captured = values; },
    });
    expect(captured.email).toBe('b@x');
  });

  it('registerField で defaultValue が values に反映される', () => {
    const client = createFormClient({ provider: 'conform' });
    registerField(client, { name: 'name', defaultValue: 'kiwa' });
    expect(client.getValues().name).toBe('kiwa');
  });

  it('getFieldError で validate 失敗後の field-level error を取得', async () => {
    const client = createFormClient({ provider: 'zod' });
    registerField(client, { name: 'email', rule: { required: true } });
    await client.submit({ onSubmit: () => {} });
    const err = getFieldError(client, 'email');
    expect(err).not.toBeNull();
    expect(err?.field).toBe('email');
    expect(err?.code).toBe('required');
  });
});
