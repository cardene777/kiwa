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
  const chains: AnvilClusterHandle['chains'] = [];

  try {
    for (const chain of opts.chains) {
      const handle = await startAnvil({
        port: chain.port,
        chainId: chain.chainId,
        detached: true,
        killExistingOnPort: true,
      });
      chains.push({ ...handle, chainId: chain.chainId });
    }
  } catch (error) {
    await Promise.allSettled(chains.map((chain) => chain.stop()));
    throw error;
  }

  return {
    chains,
    async stopAll() {
      await Promise.all(chains.map((chain) => chain.stop()));
    },
  };
}
