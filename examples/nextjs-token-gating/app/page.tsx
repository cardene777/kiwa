'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import {
  GATE_NFT,
  GATED_CONTENT,
  GATE_NFT_ABI,
  GATED_CONTENT_ABI,
} from '@/lib/wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const publicClient = usePublicClient();
  const [secret, setSecret] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [tick, setTick] = useState(0);
  void tick;

  const balance = useReadContract({
    address: GATE_NFT,
    abi: GATE_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const gated = useReadContract({
    address: GATED_CONTENT,
    abi: GATED_CONTENT_ABI,
    functionName: 'isGated',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const accessCount = useReadContract({
    address: GATED_CONTENT,
    abi: GATED_CONTENT_ABI,
    functionName: 'accessCount',
    query: { staleTime: 0, refetchInterval: 1500 },
  });

  const refetchAll = () =>
    setTimeout(() => {
      void balance.refetch();
      void gated.refetch();
      void accessCount.refetch();
      setTick((n) => n + 1);
    }, 800);

  const onMint = () => {
    writeContract(
      {
        address: GATE_NFT,
        abi: GATE_NFT_ABI,
        functionName: 'mint',
      },
      { onSuccess: refetchAll },
    );
  };

  const onReadSecret = async () => {
    setError('');
    setSecret('');
    if (!publicClient || !address) return;
    try {
      // simulate read (state changing function getSecret は writeContract で実行 + receipt で確認)
      // 簡略のため publicClient.simulateContract で revert 検出、success なら writeContract で発行
      await publicClient.simulateContract({
        address: GATED_CONTENT,
        abi: GATED_CONTENT_ABI,
        functionName: 'getSecret',
        account: address,
      });
      writeContract(
        {
          address: GATED_CONTENT,
          abi: GATED_CONTENT_ABI,
          functionName: 'getSecret',
        },
        {
          onSuccess: () => {
            // SECRET は constant なので直接表示
            setSecret('alpha-pass-2025');
            refetchAll();
          },
          onError: (e) => setError(e.message.slice(0, 100)),
        },
      );
    } catch (e) {
      setError((e as Error).message.slice(0, 100));
    }
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Token Gating</h1>
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
        <div data-testid="nft-balance">
          nftBalance: {balance.data !== undefined ? String(balance.data) : '(loading)'}
        </div>
        <div data-testid="is-gated">
          isGated: {gated.data !== undefined ? String(gated.data) : '(loading)'}
        </div>
        <div data-testid="access-count">
          accessCount: {accessCount.data !== undefined ? String(accessCount.data) : '(loading)'}
        </div>
        <div data-testid="secret">secret: {secret || '(none)'}</div>
        <div data-testid="error">error: {error || '(none)'}</div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="mint-button"
            onClick={onMint}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#7C3AED',
              color: 'white',
            }}
          >
            Mint NFT
          </button>
          <button
            data-testid="read-secret-button"
            onClick={onReadSecret}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#059669',
              color: 'white',
            }}
          >
            Read Secret
          </button>
        </div>
      </section>
    </main>
  );
}
