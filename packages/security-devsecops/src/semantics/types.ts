/**
 * DevSecOps semantics — provider-neutral axis SSOT (v0.1)。
 *
 * v0.1 covers 6 axis = SAST (Static Application Security Testing) + SCA
 * (Software Composition Analysis) + Secret scan + IaC scan + DAST (Dynamic
 * Application Security Testing) + Container security。
 *
 * Each axis is a small pure state-machine helper that returns a neutral
 * envelope。 downstream tests can drive the axis without knowing the
 * provider payload dialect (Semgrep / Trivy / Gitleaks / tfsec / OWASP ZAP
 * / Grype)。
 */
export type ScanProvider =
  | 'semgrep'
  | 'trivy'
  | 'gitleaks'
  | 'tfsec'
  | 'owasp-zap'
  | 'grype';

export type DevSecOpsAxis =
  | 'sast'
  | 'sca'
  | 'secret-scan'
  | 'iac-scan'
  | 'dast'
  | 'container-security';

export type NeutralEventName =
  // SAST
  | 'sast.scan-started'
  | 'sast.finding-detected'
  | 'sast.suppressed'
  | 'sast.scan-completed'
  // SCA
  | 'sca.dependency-analyzed'
  | 'sca.vuln-detected'
  | 'sca.license-flagged'
  | 'sca.scan-completed'
  // Secret scan
  | 'secret.pattern-matched'
  | 'secret.entropy-flagged'
  | 'secret.allowlisted'
  | 'secret.scan-completed'
  // IaC scan
  | 'iac.resource-analyzed'
  | 'iac.misconfig-detected'
  | 'iac.compliance-checked'
  | 'iac.scan-completed'
  // DAST
  | 'dast.crawl-started'
  | 'dast.attack-attempted'
  | 'dast.vulnerability-confirmed'
  | 'dast.scan-completed'
  // Container security
  | 'container.image-scanned'
  | 'container.cve-detected'
  | 'container.malware-flagged'
  | 'container.scan-completed';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AxisStep<TState> {
  neutralEvent: NeutralEventName;
  provider: ScanProvider;
  state: TState;
  metadata: Record<string, string | number | boolean>;
}
