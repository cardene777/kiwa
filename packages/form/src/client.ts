import type { SchemaLike, FieldError } from './validator.js';

export type FormProvider = 'react-hook-form' | 'zod' | 'formik' | 'conform';

export interface FieldRegistration {
  name: string;
  defaultValue?: unknown;
  rule?: SchemaLike['fields'][string];
}

export interface SubmitOptions {
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onError?: (errors: FieldError[]) => void;
}

export interface SubmitResult {
  ok: boolean;
  id: string;
  provider: FormProvider;
  values: Record<string, unknown>;
  errors: FieldError[];
  submittedAt: number;
}

export interface SubmittedRecord extends SubmitResult {}

export interface FormClient {
  provider: FormProvider;
  registerField: (reg: FieldRegistration) => void;
  setValue: (name: string, value: unknown) => void;
  getValues: () => Record<string, unknown>;
  getSchema: () => SchemaLike;
  submit: (opts: SubmitOptions) => Promise<SubmitResult>;
  getLastErrors: () => FieldError[];
  listSubmitted: () => SubmittedRecord[];
  clear: () => void;
}

export interface CreateFormClientOptions {
  provider?: FormProvider;
  defaultValues?: Record<string, unknown>;
  now?: () => number;
  idSeed?: number;
}

/**
 * form client は provider 別 (RHF/Zod/Formik/Conform) の validate + submit 挙動を統一
 * interface で叩く。 provider 差は id prefix と将来的な error message format のみで、
 * 実 provider の SDK を差し替えても signature 一致で書ける想定。
 */
export function createFormClient(options: CreateFormClientOptions = {}): FormClient {
  const provider = options.provider ?? 'react-hook-form';
  const now = options.now ?? (() => 1);
  const idPrefix = { 'react-hook-form': 'rhf', zod: 'zod', formik: 'fmk', conform: 'cfm' }[provider];
  const values: Record<string, unknown> = { ...(options.defaultValues ?? {}) };
  const schema: SchemaLike = { fields: {} };
  const submitted: SubmittedRecord[] = [];
  let lastErrors: FieldError[] = [];
  let counter = options.idSeed ?? 0;

  return {
    provider,
    registerField(reg: FieldRegistration): void {
      if (reg.rule) schema.fields[reg.name] = reg.rule;
      if (reg.defaultValue !== undefined && !(reg.name in values)) {
        values[reg.name] = reg.defaultValue;
      }
    },
    setValue(name: string, value: unknown): void {
      values[name] = value;
    },
    getValues(): Record<string, unknown> {
      return { ...values };
    },
    getSchema(): SchemaLike {
      return { fields: { ...schema.fields } };
    },
    async submit(opts: SubmitOptions): Promise<SubmitResult> {
      counter += 1;
      const { validateSchema } = await import('./validator.js');
      const result = validateSchema(schema, values, provider);
      lastErrors = result.errors;
      const id = `${idPrefix}-${counter}`;
      const submittedAt = now();
      if (!result.ok) {
        opts.onError?.(result.errors);
        const failed: SubmitResult = { ok: false, id, provider, values: { ...values }, errors: result.errors, submittedAt };
        submitted.push(failed);
        return failed;
      }
      await opts.onSubmit({ ...values });
      const ok: SubmitResult = { ok: true, id, provider, values: { ...values }, errors: [], submittedAt };
      submitted.push(ok);
      return ok;
    },
    getLastErrors(): FieldError[] {
      return [...lastErrors];
    },
    listSubmitted(): SubmittedRecord[] {
      return [...submitted];
    },
    clear(): void {
      submitted.length = 0;
      lastErrors = [];
    },
  };
}
