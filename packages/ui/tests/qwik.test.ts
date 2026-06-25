/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import {
  setupQwikComponentEnv,
  type SetupQwikComponentEnvOptions,
} from '../src/index.js';

/**
 * The Qwik adapter requires `@builder.io/qwik`'s Vite optimizer for JSX
 * transformation, which conflicts with the React JSX transform used by the
 * rest of this package's test pipeline. We therefore exercise the adapter's
 * shape (types + error branch) here and leave end-to-end JSX rendering to a
 * follow-up PR that ships a Qwik-specific Vitest project.
 *
 * The render path itself is covered by integration tests in consuming Qwik
 * projects (`examples/qwik-component-poc` to follow).
 */

describe('setupQwikComponentEnv (contract)', () => {
  it('throws a friendly error when @noma.to/qwik-testing-library is absent', async () => {
    // The default test workspace intentionally does NOT install
    // `@noma.to/qwik-testing-library` because its peer Vite optimizer would
    // collide with React JSX. The dynamic import must therefore fail with the
    // adapter's own guidance string instead of an unhelpful "cannot find
    // module" stacktrace.
    await expect(
      setupQwikComponentEnv({ mode: 'render' } as SetupQwikComponentEnvOptions),
    ).rejects.toThrow(/qwik-testing-library/);
  });
});
