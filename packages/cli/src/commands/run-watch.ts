import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type RunWatchLayer = 'unit' | 'api' | 'ui' | 'data' | 'cli' | 'e2e';

export const RUN_WATCH_LAYER_DIRS: Record<RunWatchLayer, string> = {
  unit: 'tests/unit',
  api: 'tests/integration',
  ui: 'tests',
  data: 'tests',
  cli: 'tests',
  e2e: 'tests/e2e',
};

export interface RunWatchOptions {
  layers: RunWatchLayer[];
  cwd: string;
  /** When true, the worker only resolves the planned commands without spawning anything (used by tests). */
  dryRun?: boolean;
  /** Inject a custom spawner (used by tests). */
  spawnFn?: (cmd: string, args: string[], opts: { cwd: string; env: NodeJS.ProcessEnv; stdio: 'inherit' | 'pipe' }) => ChildProcess;
}

export interface RunWatchPlan {
  layer: RunWatchLayer;
  cmd: string;
  args: string[];
}

export interface RunWatchResult {
  plans: RunWatchPlan[];
  children: ChildProcess[];
}

export function planRunWatch(layers: RunWatchLayer[]): RunWatchPlan[] {
  return layers.map((layer) => ({
    layer,
    cmd: 'pnpm',
    args: ['exec', 'vitest', '--watch', '--dir', RUN_WATCH_LAYER_DIRS[layer]],
  }));
}

export function runWatch(opts: RunWatchOptions): RunWatchResult {
  if (opts.layers.length === 0) {
    throw new Error('kiwa run --watch: at least one layer is required (use --layer L)');
  }
  for (const layer of opts.layers) {
    if (!(layer in RUN_WATCH_LAYER_DIRS)) {
      throw new Error(`kiwa run --watch: unknown layer "${layer}"`);
    }
  }
  if (!existsSync(resolve(opts.cwd, 'package.json'))) {
    throw new Error(`kiwa run --watch: no package.json found at ${opts.cwd}`);
  }
  const plans = planRunWatch(opts.layers);
  if (opts.dryRun) {
    return { plans, children: [] };
  }
  const spawnFn = opts.spawnFn ?? ((cmd, args, spawnOpts) => spawn(cmd, args, spawnOpts));
  const children = plans.map((plan) =>
    spawnFn(plan.cmd, plan.args, {
      cwd: opts.cwd,
      env: { ...process.env, KIWA_WATCH_LAYER: plan.layer },
      stdio: 'inherit',
    }),
  );
  return { plans, children };
}
