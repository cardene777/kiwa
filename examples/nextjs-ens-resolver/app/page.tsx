'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { RESOLVER, RESOLVER_ABI } from '@/lib/wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [nameInput, setNameInput] = useState<string>('alice');
  const [lookupName, setLookupName] = useState<string>('alice');
  const [tick, setTick] = useState(0);
  void tick;

  // forward resolve: name → address
  const resolved = useReadContract({
    address: RESOLVER,
    abi: RESOLVER_ABI,
    functionName: 'resolve',
    args: [lookupName],
    query: { enabled: Boolean(lookupName), staleTime: 0, refetchInterval: 1500 },
  });

  // reverse lookup: my address → name
  const myReverse = useReadContract({
    address: RESOLVER,
    abi: RESOLVER_ABI,
    functionName: 'reverseLookup',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const refetchAll = () =>
    setTimeout(() => {
      void resolved.refetch();
      void myReverse.refetch();
      setTick((n) => n + 1);
    }, 800);

  const onSetRecord = () => {
    if (!address) return;
    writeContract(
      {
        address: RESOLVER,
        abi: RESOLVER_ABI,
        functionName: 'setRecord',
        args: [nameInput, address],
      },
      { onSuccess: refetchAll },
    );
  };

  const onSetReverse = () => {
    writeContract(
      {
        address: RESOLVER,
        abi: RESOLVER_ABI,
        functionName: 'setReverse',
        args: [nameInput],
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e ENS Resolver</h1>
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
        <div data-testid="account-address">
          myAddress: {address ?? '(none)'}
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          name input:
          <input
            data-testid="name-input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          lookup name (forward resolve):
          <input
            data-testid="lookup-input"
            value={lookupName}
            onChange={(e) => setLookupName(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }}
          />
        </label>

        <div data-testid="resolved-address">
          resolved: {resolved.data !== undefined ? String(resolved.data) : '(loading)'}
        </div>
        <div data-testid="reverse-name">
          myReverseName:{' '}
          {myReverse.data !== undefined ? `"${String(myReverse.data)}"` : '(loading)'}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="set-record-button"
            onClick={onSetRecord}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#7C3AED',
              color: 'white',
            }}
          >
            Set Record (name → my address)
          </button>
          <button
            data-testid="set-reverse-button"
            onClick={onSetReverse}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#059669',
              color: 'white',
            }}
          >
            Set Reverse (my address → name)
          </button>
        </div>
      </section>
    </main>
  );
}
