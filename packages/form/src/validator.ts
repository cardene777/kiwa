import type { FormProvider } from './client.js';

export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidateResult {
  ok: boolean;
  errors: FieldError[];
  values: Record<string, unknown>;
}

/**
 * SchemaLike = 4 provider の schema 表現を統一。 各 field に validate rule (required / min /
 * max / pattern / customFn) を declaratively 持たせる。 実 provider (Zod object /
 * yup object / RHF resolver) を差し替えても shape は変わらない想定。
 */
export interface SchemaLike {
  fields: Record<string, {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
  }>;
}

/**
 * provider 別 validate 挙動を統一 result で返す。 実 provider (Zod safeParse / Yup validate /
 * RHF resolver / Conform parseWithZod) に差し替えても signature は変わらない想定。
 */
export function validateSchema(
  schema: SchemaLike,
  values: Record<string, unknown>,
  provider: FormProvider = 'react-hook-form',
): ValidateResult {
  const errors: FieldError[] = [];
  for (const [name, rule] of Object.entries(schema.fields)) {
    const value = values[name];
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: name, message: `${name} is required`, code: 'required' });
      continue;
    }
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push({ field: name, message: `${name} min ${rule.min}`, code: 'min' });
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push({ field: name, message: `${name} max ${rule.max}`, code: 'max' });
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({ field: name, message: `${name} pattern mismatch`, code: 'pattern' });
      }
    }
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({ field: name, message: `${name} min ${rule.min}`, code: 'min' });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({ field: name, message: `${name} max ${rule.max}`, code: 'max' });
      }
    }
    if (rule.custom) {
      const err = rule.custom(value);
      if (err !== null) {
        errors.push({ field: name, message: err, code: 'custom' });
      }
    }
  }
  // provider 差は現状 shape のみ (error message format 差など将来対応)、 現時点で same 挙動。
  void provider;
  return { ok: errors.length === 0, errors, values };
}
