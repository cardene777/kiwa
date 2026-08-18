// Mutation runs exclude the two live-container test files (#1981).
//
// Both start a real MySQL / Postgres through testcontainers in `beforeAll`, so
// Stryker's per-test coverage pays a full container startup for every mutant they
// cover. Measured on `setup-orm-env.js:1-120`: 107 mutants took over 11m30s with
// them in the run and 20s without.
//
// Speed is not the whole reason. On the slice they alone cover (`:81-91`, the
// postgres-js driver wiring) the 15 mutants came back 1 killed / 6 timeout /
// 5 survived / 3 no-coverage in 3m19s. The covered score of 58.33 was seven twelfths
// timeout, and a mutant that hangs the connection times out whether or not the test
// asserts anything. Reporting those mutants as no-coverage is the more honest
// reading: no fast test reaches that code yet, and the count says so.
//
// `KIWA_MODE=real` is the repo's existing gate for container-backed tests
// (`tests/fidelity/postgres-real.real.fidelity.test.ts` carries it); these two
// never adopted it.
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['.vitest-dist/tests/**/*.test.js'],
    exclude: ['.vitest-dist/tests/live-mode.test.js', '.vitest-dist/tests/live-mysql.test.js'],
    environment: 'node',
  },
});
