'use client';

import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, usePublicClient, useReadContract, useSwitchChain } from 'wagmi';
import {
  CONTRACT_ADDRESS_BY_CHAIN,
  CHAIN_LABEL,
  PROBE_USER,
  SIMPLE_TOKEN_ABI,
  mainnetSim,
  optimismSim,
  baseSim,
} from '@/lib/wagmi';

const CHAINS = [mainnetSim, optimismSim, baseSim];

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const publicClient = usePublicClient({ chainId });
  const [probeBalance, setProbeBalance] = useState<string>('(loading)');

  const currentToken = CONTRACT_ADDRESS_BY_CHAIN[chainId] ?? '0x0';
  const currentLabel = CHAIN_LABEL[chainId] ?? `unknown(${chainId})`;

  const myBalance = useReadContract({
    address: currentToken as `0x${string}`,
    abi: SIMPLE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: Boolean(address) },
  });

  useEffect(() => {
    let cancelled = false;

    const readProbeBalance = async () => {
      if (!publicClient) {
        if (!cancelled) setProbeBalance('(loading)');
        return;
      }

      const balance = await publicClient.readContract({
        address: currentToken as `0x${string}`,
        abi: SIMPLE_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [PROBE_USER],
      });

      if (!cancelled) {
        setProbeBalance(String(balance));
      }
    };

    void readProbeBalance();
    const interval = setInterval(() => void readProbeBalance(), 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentToken, publicClient]);

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Multi-Chain</h1>
        <ConnectButton />
      </header>

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div data-testid="connection-status">
          status: {isConnected ? 'connected' : 'disconnected'}
        </div>
        <div data-testid="current-chain">
          chain: {currentLabel} (id={chainId})
        </div>
        <div data-testid="current-contract">
          contract: {currentToken}
        </div>
        <div data-testid="my-balance">
          balance:{' '}
          {myBalance.data !== undefined ? String(myBalance.data) : '(loading)'}
        </div>
        <div data-testid="probe-balance">probeBalance: {probeBalance}</div>

        <div style={{ display: 'flex', gap: 8 }}>
          {CHAINS.map((c) => (
            <button
              key={c.id}
              data-testid={`switch-${c.id}-button`}
              onClick={() => switchChain({ chainId: c.id })}
              disabled={!isConnected || isPending || chainId === c.id}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #ccc',
                background: chainId === c.id ? '#7C3AED' : 'white',
                color: chainId === c.id ? 'white' : 'black',
                cursor: chainId === c.id ? 'default' : 'pointer',
              }}
            >
              {CHAIN_LABEL[c.id]} ({c.id})
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
