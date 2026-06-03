'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import {
  VEST_TOKEN,
  VESTING,
  ERC20_ABI,
  VESTING_ABI,
} from '@/lib/wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending, error: writeError } = useWriteContract();
  const [tick, setTick] = useState(0);
  void tick;

  const tokenBalance = useReadContract({
    address: VEST_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });
  const releasable = useReadContract({
    address: VESTING,
    abi: VESTING_ABI,
    functionName: 'releasable',
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });
  const released = useReadContract({
    address: VESTING,
    abi: VESTING_ABI,
    functionName: 'released',
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });
  const total = useReadContract({
    address: VESTING,
    abi: VESTING_ABI,
    functionName: 'total',
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const cliff = useReadContract({
    address: VESTING,
    abi: VESTING_ABI,
    functionName: 'cliff',
    query: { enabled: Boolean(address), staleTime: 0 },
  });

  const refetchAll = () =>
    setTimeout(() => {
      void tokenBalance.refetch();
      void releasable.refetch();
      void released.refetch();
      setTick((n) => n + 1);
    }, 800);

  const onRelease = () => {
    writeContract(
      {
        address: VESTING,
        abi: VESTING_ABI,
        functionName: 'release',
      },
      { onSuccess: refetchAll },
    );
  };

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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Vesting</h1>
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
        <div data-testid="token-balance">
          tokenBalance:{' '}
          {tokenBalance.data !== undefined ? String(tokenBalance.data) : '(loading)'}
        </div>
        <div data-testid="total">
          total: {total.data !== undefined ? String(total.data) : '(loading)'}
        </div>
        <div data-testid="cliff">
          cliff: {cliff.data !== undefined ? String(cliff.data) : '(loading)'}
        </div>
        <div data-testid="releasable">
          releasable:{' '}
          {releasable.data !== undefined ? String(releasable.data) : '(loading)'}
        </div>
        <div data-testid="released">
          released:{' '}
          {released.data !== undefined ? String(released.data) : '(loading)'}
        </div>
        <div data-testid="release-error">
          releaseError: {writeError ? writeError.message.slice(0, 80) : 'none'}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="release-button"
            onClick={onRelease}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#7C3AED',
              color: 'white',
            }}
          >
            Release
          </button>
        </div>
      </section>
    </main>
  );
}
