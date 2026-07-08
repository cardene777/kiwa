import {
  runSecurityAudit,
  summarizeAuditReport,
  type AuditInvocation,
  type AuditPreset,
  type AuditReport,
  type AuditSummary,
} from '@kiwa-test/security-devsecops';

/**
 * skill 4 種を library single entry で置換する dogfood。
 * default = mock (test 常時可能)、 KIWA_SECURITY_MODE=real で real 経路 opt-in。
 */
export interface SkillRunResult {
  preset: AuditPreset;
  report: AuditReport;
  summary: AuditSummary;
}

export async function runSkill(
  preset: AuditPreset,
  target: string = '/repo',
  mode: AuditInvocation['mode'] = 'mock',
): Promise<SkillRunResult> {
  const report = await runSecurityAudit({ preset, target, mode });
  const summary = summarizeAuditReport(report);
  return { preset, report, summary };
}

export async function runAllSkills(target: string = '/repo'): Promise<SkillRunResult[]> {
  const presets: AuditPreset[] = ['audit-all', 'supply-chain', 'specialty', 'threat-model'];
  const results: SkillRunResult[] = [];
  for (const p of presets) {
    results.push(await runSkill(p, target, 'mock'));
  }
  return results;
}
