/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createFormClient,
  validateSchema,
  registerField,
  submitForm,
  getFieldError,
} from '../../src/index.js';

const MODULE = 'form-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('form app scenario perf (real workload)', () => {
  it('3-layer perf: signup_workflow / multi_field_validate_batch / submit_error_handling', async () => {
    const signupSchema = {
      fields: {
        email: { required: true, pattern: /@/ },
        password: { required: true, min: 8 },
        age: { min: 13, max: 120 },
      },
    };

    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'signup_workflow (10 register+submit cycle)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const client = createFormClient({ provider: 'react-hook-form' });
              registerField(client, { name: 'email', rule: signupSchema.fields.email, defaultValue: `user${i}@x` });
              registerField(client, { name: 'password', rule: signupSchema.fields.password, defaultValue: 'p@ssw0rd' });
              registerField(client, { name: 'age', rule: signupSchema.fields.age, defaultValue: 20 + i });
              await submitForm(client, { onSubmit: () => {} });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'multi_field_validate_batch (5 provider-mixed validate)',
          fn: async () => {
            const providers = ['react-hook-form', 'zod', 'formik', 'conform', 'react-hook-form'] as const;
            for (let i = 0; i < 5; i++) {
              validateSchema(signupSchema, { email: 'u@x', password: 'p@ssw0rd', age: 20 + i }, providers[i]);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'submit_error_handling (5 required-missing → onError catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const client = createFormClient({ provider: 'formik' });
              registerField(client, { name: 'email', rule: { required: true } });
              let caught = false;
              await submitForm(client, {
                onSubmit: () => {},
                onError: () => { caught = true; },
              });
              if (!caught) throw new Error(`expected onError but not called at i=${i}`);
              getFieldError(client, 'email');
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
