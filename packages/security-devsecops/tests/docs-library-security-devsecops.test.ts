import { expect, test } from 'vitest';
import { axisForPreset, runSecurityAudit, summarizeAuditReport } from '../src/index.js';

test('the quickstart collects the mock supply-chain axes without claiming a scan ran', async () => {
  expect(axisForPreset('supply-chain')).toEqual(['sca', 'container-security']);
  const report = await runSecurityAudit({
    preset: 'supply-chain',
    target: '/workspace',
    mode: 'mock',
    metadata: { runId: 'ci-42' },
  });
  const summary = summarizeAuditReport(report);
  expect(summary.totalAxis).toBe(2);
  expect(summary.completedAxis).toBe(2);
  expect(summary.perAxis.map((item) => item.axis).sort()).toEqual(['container-security', 'sca']);
});

test('the how-to distinguishes the real-mode configuration gate from threat-model completion', async () => {
  await expect(
    runSecurityAudit({ preset: 'supply-chain', target: '/repo', mode: 'real' }),
  ).rejects.toThrow(/KIWA_SECURITY_MODE/);

  const report = await runSecurityAudit({ preset: 'threat-model', target: '/repo', mode: 'mock' });
  const summary = summarizeAuditReport(report);
  expect(summary.stridDreadTags).toHaveLength(6);
  expect(summary.stridDreadTags?.every((tag) => tag.tag.startsWith('stride:'))).toBe(true);
});
