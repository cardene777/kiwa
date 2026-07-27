import { expect, it } from 'vitest';
import {
  buildReleaseInvariantsSummary,
  checkGateScriptPackageCoverage,
  checkProvenanceFlagAbsence,
  checkReleaseScriptFilter,
} from '../src/index.js';

const publishable = [{ name: '@kiwa-lab/core' }, { name: '@kiwa-lab/auth' }];

it('keeps the documented release policy tutorial runnable', () => {
  const summary = buildReleaseInvariantsSummary({
    releaseScript: [
      'pnpm -F @kiwa-lab/core build',
      'pnpm -F @kiwa-lab/auth build',
      'pnpm publish --filter @kiwa-lab/core --filter @kiwa-lab/auth',
    ].join(' && '),
    mutationGateScript: [
      'pnpm -F @kiwa-lab/core test:mutation',
      'pnpm -F @kiwa-lab/auth test:mutation',
    ].join(' && '),
    publishable,
  });
  expect(summary.ok).toBe(true);

  const violatingRelease = [
    'pnpm -F @kiwa-lab/core build',
    'pnpm -F @kiwa-lab/auth build',
    'pnpm publish --filter @kiwa-lab/core --provenance',
  ].join(' && ');
  const filters = checkReleaseScriptFilter(violatingRelease, publishable);
  expect(filters.missingPublishFilter).toEqual(['@kiwa-lab/auth']);
  expect(checkProvenanceFlagAbsence(violatingRelease).provenanceFlagPresent).toBe(true);
  expect(checkGateScriptPackageCoverage('pnpm -F @kiwa-lab/core test:mutation', publishable)
    .missingMutationFilter).toEqual(['@kiwa-lab/auth']);
});
