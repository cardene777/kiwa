import type { Severity } from '../semantics/types.js';
import type { AuditReport, AuditSummary } from './types.js';

/**
 * Audit report 集約 API — skill 出力層 (STRIDE / DREAD 分類 tag 添付) に流し込む。
 * threat-model preset の時のみ STRIDE tag 添付、 他 preset は tag 空。
 */
export function summarizeAuditReport(report: AuditReport): AuditSummary {
  const totalAxis = report.results.length;
  const completedAxis = report.results.filter((r) => r.completed).length;
  const totalEvents = report.results.reduce((sum, r) => sum + r.eventCount, 0);
  const totalDurationMs = report.finishedAt - report.startedAt;
  const perAxis = report.results.map((r) => ({
    axis: r.axis,
    completed: r.completed,
    eventCount: r.eventCount,
  }));

  const summary: AuditSummary = {
    preset: report.preset,
    totalAxis,
    completedAxis,
    totalEvents,
    totalDurationMs,
    perAxis,
  };

  if (report.preset === 'threat-model') {
    summary.stridDreadTags = report.results.map((r) => {
      const tag = tagForAxis(r.axis);
      const severity: Severity = r.completed ? 'medium' : 'high';
      return { axis: r.axis, tag, severity };
    });
  }

  return summary;
}

function tagForAxis(axis: string): string {
  // STRIDE = Spoofing / Tampering / Repudiation / Information disclosure /
  // Denial of service / Elevation of privilege。 DevSecOps 6 axis を STRIDE の
  // 相当 tag に mapping する簡易 SSOT。
  const map: Record<string, string> = {
    sast: 'stride:tampering',
    sca: 'stride:elevation-of-privilege',
    'secret-scan': 'stride:information-disclosure',
    'iac-scan': 'stride:elevation-of-privilege',
    dast: 'stride:spoofing',
    'container-security': 'stride:denial-of-service',
  };
  return map[axis] ?? 'stride:unknown';
}
