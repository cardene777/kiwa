/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';
import {
  setupSvelteComponentEnv,
  type SetupSvelteComponentEnvOptions,
} from '../src/index.js';

/**
 * Svelte 5 requires its own compiler + runtime setup, which conflicts with the
 * React JSX pipeline used by the rest of this package. Rendering is left to a
 * follow-up `examples/svelte-component-poc` PR. Here we verify the adapter's
 * contract: a missing peer dep must surface a helpful guidance string, not an
 * opaque "cannot find module" stacktrace.
 */
describe('setupSvelteComponentEnv (contract)', () => {
  it('throws a friendly error when @testing-library/svelte is absent', async () => {
    vi.resetModules();
    vi.doMock('@testing-library/svelte', () => {
      throw new Error('not installed');
    });
    const fresh = await import('../src/svelte.js');
    await expect(
      fresh.setupSvelteComponentEnv({ mode: 'render' } as SetupSvelteComponentEnvOptions),
    ).rejects.toThrow(/@testing-library\/svelte/);
    vi.doUnmock('@testing-library/svelte');
    vi.resetModules();
  });
});
