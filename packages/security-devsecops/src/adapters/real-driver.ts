/**
 * Real driver 共通 helper — 実 CLI 呼出を child_process 経由で隠蔽する契約。
 *
 * v0.2 では adapter interface を confirm し、 実 CLI 呼出は
 * env-gate + spawnCliDriver に集約する。 env 未設定 or CLI 不在時は explicit
 * throw、 test 側は mock adapter を使う (default 経路)。
 *
 * production 経路。 `KIWA_SECURITY_MODE=real` + 各 CLI URL env が全部揃った時のみ
 * 実 CLI 呼出、 それ以外は throw。 mock adapter は env に関係なく常時動作。
 */

export interface RealDriverEnv {
  mode: 'real';
  semgrepUrl?: string;
  trivyUrl?: string;
  gitleaksUrl?: string;
  tfsecUrl?: string;
  zapUrl?: string;
  grypeUrl?: string;
}

export function readRealDriverEnv(env: NodeJS.ProcessEnv = process.env): RealDriverEnv | null {
  if (env.KIWA_SECURITY_MODE !== 'real') return null;
  const out: RealDriverEnv = { mode: 'real' };
  if (env.KIWA_SEMGREP_URL) out.semgrepUrl = env.KIWA_SEMGREP_URL;
  if (env.KIWA_TRIVY_URL) out.trivyUrl = env.KIWA_TRIVY_URL;
  if (env.KIWA_GITLEAKS_URL) out.gitleaksUrl = env.KIWA_GITLEAKS_URL;
  if (env.KIWA_TFSEC_URL) out.tfsecUrl = env.KIWA_TFSEC_URL;
  if (env.KIWA_ZAP_URL) out.zapUrl = env.KIWA_ZAP_URL;
  if (env.KIWA_GRYPE_URL) out.grypeUrl = env.KIWA_GRYPE_URL;
  return out;
}

export interface CliDriverSpec {
  cliName: string;
  urlEnvKey: keyof RealDriverEnv;
  requiredEnvValue: string | undefined;
}

export function assertRealDriverAvailable(
  spec: CliDriverSpec,
  env: RealDriverEnv | null,
): void {
  if (env === null) {
    throw new Error(
      `real driver requested but KIWA_SECURITY_MODE!=='real'; call skipped for ${spec.cliName}`,
    );
  }
  if (!spec.requiredEnvValue) {
    throw new Error(
      `${spec.cliName} URL env (${String(spec.urlEnvKey)}) not set; real driver unavailable`,
    );
  }
}
