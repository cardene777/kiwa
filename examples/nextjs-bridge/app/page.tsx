'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import {
  SOURCE_TOKEN,
  SOURCE_BRIDGE,
  DEST_TOKEN,
  DEST_BRIDGE,
  ERC20_ABI,
  SOURCE_BRIDGE_ABI,
  DEST_BRIDGE_ABI,
  BRIDGE_AMOUNT,
  l1Sim,
  l2Sim,
} from '@/lib/wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, isPending } = useWriteContract();
  const [tick, setTick] = useState(0);
  void tick;

  const sourceBalance = useReadContract({
    address: SOURCE_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: l1Sim.id,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });
  const destBalance = useReadContract({
    address: DEST_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: l2Sim.id,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });
  const sourceNonce = useReadContract({
    address: SOURCE_BRIDGE,
    abi: SOURCE_BRIDGE_ABI,
    functionName: 'nonce',
    chainId: l1Sim.id,
    query: { staleTime: 0, refetchInterval: 1500 },
  });

  const refetchAll = () =>
    setTimeout(() => {
      void sourceBalance.refetch();
      void destBalance.refetch();
      void sourceNonce.refetch();
      setTick((n) => n + 1);
    }, 800);

  const onApprove = () => {
    if (!address) return;
    writeContract(
      {
        address: SOURCE_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [SOURCE_BRIDGE, BRIDGE_AMOUNT],
        chainId: l1Sim.id,
      },
      { onSuccess: refetchAll },
    );
  };

  const onLock = () => {
    if (!address) return;
    writeContract(
      {
        address: SOURCE_BRIDGE,
        abi: SOURCE_BRIDGE_ABI,
        functionName: 'bridgeLock',
        args: [BRIDGE_AMOUNT, address],
        chainId: l1Sim.id,
      },
      { onSuccess: refetchAll },
    );
  };

  const onBurn = () => {
    if (!address) return;
    writeContract(
      {
        address: DEST_BRIDGE,
        abi: DEST_BRIDGE_ABI,
        functionName: 'bridgeBurn',
        args: [BRIDGE_AMOUNT, address],
        chainId: l2Sim.id,
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Bridge</h1>
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
        <div data-testid="current-chain">chain: {chainId}</div>
        <div data-testid="source-balance">
          sourceBalance (L1):{' '}
          {sourceBalance.data !== undefined ? String(sourceBalance.data) : '(loading)'}
        </div>
        <div data-testid="dest-balance">
          destBalance (L2):{' '}
          {destBalance.data !== undefined ? String(destBalance.data) : '(loading)'}
        </div>
        <div data-testid="source-nonce">
          sourceNonce: {sourceNonce.data !== undefined ? String(sourceNonce.data) : '(loading)'}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="switch-l1-button"
            onClick={() => switchChain({ chainId: l1Sim.id })}
            disabled={!isConnected || chainId === l1Sim.id}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ccc',
              background: chainId === l1Sim.id ? '#7C3AED' : 'white',
              color: chainId === l1Sim.id ? 'white' : 'black',
            }}
          >
            Switch L1
          </button>
          <button
            data-testid="switch-l2-button"
            onClick={() => switchChain({ chainId: l2Sim.id })}
            disabled={!isConnected || chainId === l2Sim.id}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ccc',
              background: chainId === l2Sim.id ? '#7C3AED' : 'white',
              color: chainId === l2Sim.id ? 'white' : 'black',
            }}
          >
            Switch L2
          </button>
          <button
            data-testid="approve-button"
            onClick={onApprove}
            disabled={!isConnected || isPending}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ccc' }}
          >
            Approve (L1)
          </button>
          <button
            data-testid="lock-button"
            onClick={onLock}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#059669',
              color: 'white',
            }}
          >
            Lock (L1 → L2)
          </button>
          <button
            data-testid="burn-button"
            onClick={onBurn}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#DC2626',
              color: 'white',
            }}
          >
            Burn (L2 → L1)
          </button>
        </div>
      </section>
    </main>
  );
}
