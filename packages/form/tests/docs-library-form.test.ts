import { describe, expect, it } from 'vitest';
import {
  createFormClient,
  getFieldError,
  registerField,
  submitForm,
  validateAsync,
  validateDependentFields,
} from '../src/index.js';

describe('library documentation form recipes', () => {
  it('does not submit invalid values and records a valid submission', async () => {
    const invalid = createFormClient({ provider: 'zod', now: () => 1000 });
    registerField(invalid, { name: 'email', rule: { required: true, pattern: /^[^@]+@[^@]+$/ } });
    registerField(invalid, { name: 'password', rule: { min: 8 } });
    const rejected = await submitForm(invalid, {
      overrideValues: { email: 'invalid', password: 'short' },
      onSubmit: () => { throw new Error('validation failure must not submit'); },
    });
    const valid = createFormClient({ provider: 'zod', now: () => 1000 });
    registerField(valid, { name: 'email', rule: { required: true } });
    const submitted = await submitForm(valid, {
      overrideValues: { email: 'ada@example.test' },
      onSubmit: async (values) => expect(values.email).toBe('ada@example.test'),
    });

    expect(rejected).toMatchObject({ ok: false, values: { email: 'invalid', password: 'short' } });
    expect(getFieldError(invalid, 'email')).toMatchObject({ code: 'pattern' });
    expect(getFieldError(invalid, 'password')).toMatchObject({ code: 'min' });
    expect(submitted).toMatchObject({ ok: true, id: 'zod-1', errors: [] });
    expect(valid.listSubmitted()).toHaveLength(1);
  });

  it('saves overrides, returns async errors, and validates dependent fields', async () => {
    const client = createFormClient({ provider: 'formik' });
    registerField(client, { name: 'email', defaultValue: 'before@example.test' });
    let value = '';
    await submitForm(client, { overrideValues: { email: 'after@example.test' }, onSubmit: (values) => { value = String(values.email); } });
    const asyncResult = await validateAsync(
      { username: 'taken', displayName: 'Ada' },
      {
        username: async (input) => input === 'taken' ? 'already taken' : null,
        displayName: async (input) => String(input).length > 0 ? null : 'required',
      },
    );
    const dependent = validateDependentFields(
      { country: 'US', zipCode: '' },
      [{ field: 'zipCode', dependsOn: 'country', when: (country) => country === 'US', validator: (input) => input ? null : 'zip code is required' }],
    );

    expect(value).toBe('after@example.test');
    expect(client.getValues()).toEqual({ email: 'after@example.test' });
    expect(asyncResult).toMatchObject({ valid: false, errors: { username: 'already taken' } });
    expect(dependent).toEqual({ valid: false, triggered: ['zipCode'], errors: { zipCode: 'zip code is required' } });
  });
});
