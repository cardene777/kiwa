import { startAnvil, type AnvilHandle } from './anvil.js';

export interface AnvilClusterConfig {
  chains: Array<{
    chainId: number;
    port: number;
  }>;
}

export interface AnvilClusterHandle {
  chains: Array<AnvilHandle & { chainId: number }>;
  stopAll: () => Promise<void>;
}

export async function startAnvilCluster(
  opts: AnvilClusterConfig,
): Promise<AnvilClusterHandle> {
  const results = await Promise.allSettled(
    opts.chains.map((chain) =>
      startAnvil({
        port: chain.port,
        chainId: chain.chainId,
        detached: true,
        killExistingOnPort: true,
      }).then((handle) => ({ ...handle, chainId: chain.chainId })),
    ),
  );

  const chains: AnvilClusterHandle['chains'] = [];
  const failures: unknown[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      chains.push(result.value);
    } else {
      failures.push(result.reason);
    }
  }

  if (failures.length > 0) {
    await Promise.allSettled(chains.map((chain) => chain.stop()));
    throw failures[0];
  }

  return {
    chains,
    async stopAll() {
      await Promise.all(chains.map((chain) => chain.stop()));
    },
  };
}
