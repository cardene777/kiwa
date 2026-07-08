/**
 * 4 preset SSOT — skill 4 種を単一 library entry で置換する axis 選択 map。
 *
 * - audit-all = 6 axis 全実行 (security-audit skill 対応)
 * - supply-chain = SCA + Container (supply-chain skill 対応)
 * - specialty = SAST + Secret + DAST (specialty skill 対応、 domain 特化)
 * - threat-model = 6 axis 全実行 + STRIDE/DREAD 分類 tag 添付 (threat-model skill 対応)
 */
import type { DevSecOpsAxis } from '../semantics/types.js';
import type { AuditPreset } from './types.js';

export const PRESET_AXIS_MAP: Record<AuditPreset, DevSecOpsAxis[]> = {
  'audit-all': ['sast', 'sca', 'secret-scan', 'iac-scan', 'dast', 'container-security'],
  'supply-chain': ['sca', 'container-security'],
  specialty: ['sast', 'secret-scan', 'dast'],
  'threat-model': ['sast', 'sca', 'secret-scan', 'iac-scan', 'dast', 'container-security'],
};

export function axisForPreset(preset: AuditPreset): DevSecOpsAxis[] {
  return PRESET_AXIS_MAP[preset];
}
