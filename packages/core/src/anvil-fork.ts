import { startAnvilProcess, type AnvilHandle } from './anvil.js';

export interface ForkOptions {
  forkUrl: string;
  forkBlockNumber?: bigint;
  port?: number;
}

export async function startAnvilFork(options: ForkOptions): Promise<AnvilHandle> {
  const extraArgs = ['--fork-url', options.forkUrl];
  if (options.forkBlockNumber !== undefined) {
    extraArgs.push('--fork-block-number', options.forkBlockNumber.toString());
  }

  return startAnvilProcess({
    extraArgs,
    requirePristineChain: false,
    ...(options.port !== undefined ? { port: options.port } : {}),
  });
}
