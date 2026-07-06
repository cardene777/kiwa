import type { NextTarget } from './semantics/types.js';

export type KiwaTestMode = 'mock' | 'real';

export interface ResolvedMode {
  mode: KiwaTestMode;
  provider: NextTarget;
  reason: 'default-mock' | 'kiwa-mode-real' | 'missing-key' | 'invalid-mode';
}

const TARGET_KEY_ENV: Record<NextTarget, string> = {
  'app-router': 'NEXT_APP_URL',
  'pages-router': 'NEXT_PAGES_URL',
  'edge-runtime': 'EDGE_RUNTIME_URL',
};

export function resolveMode(
  provider: NextTarget,
  env: Record<string, string | undefined> = process.env,
): ResolvedMode {
  const rawMode = env.KIWA_MODE?.toLowerCase();
  if (rawMode !== undefined && rawMode !== 'real' && rawMode !== 'mock') {
    return { provider, mode: 'mock', reason: 'invalid-mode' };
  }
  if (rawMode !== 'real') {
    return { provider, mode: 'mock', reason: 'default-mock' };
  }
  const keyValue = env[TARGET_KEY_ENV[provider]];
  if (typeof keyValue !== 'string' || keyValue.length === 0) {
    return { provider, mode: 'mock', reason: 'missing-key' };
  }
  return { provider, mode: 'real', reason: 'kiwa-mode-real' };
}

export function resolveAllModes(
  env: Record<string, string | undefined> = process.env,
): ResolvedMode[] {
  const providers: NextTarget[] = ['app-router', 'pages-router', 'edge-runtime'];
  return providers.map((provider) => resolveMode(provider, env));
}

export function assertMode(
  provider: NextTarget,
  expected: KiwaTestMode,
  env: Record<string, string | undefined> = process.env,
): void {
  const resolved = resolveMode(provider, env);
  if (resolved.mode !== expected) {
    throw new Error(
      `expected ${provider} in ${expected} mode but resolved ${resolved.mode} (${resolved.reason})`,
    );
  }
}
