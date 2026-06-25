/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import {
  setupAngularComponentEnv,
  type SetupAngularComponentEnvOptions,
} from '../src/index.js';

/**
 * Angular requires its own TestBed initialization (zone.js + platformBrowserDynamic),
 * which conflicts with the React JSX pipeline used by the rest of this package.
 * The render path is therefore covered by integration tests in a follow-up
 * `examples/angular-component-poc` PR. Here we verify the adapter's contract:
 * a missing peer dep must surface a helpful guidance string, not an opaque
 * "cannot find module" stacktrace.
 */
describe('setupAngularComponentEnv (contract)', () => {
  it('throws a friendly error when @testing-library/angular is absent', async () => {
    await expect(
      setupAngularComponentEnv({ mode: 'render' } as SetupAngularComponentEnvOptions),
    ).rejects.toThrow(/@testing-library\/angular/);
  });
});
