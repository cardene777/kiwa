'use client';

import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { CONTRACT_ADDRESS, MINT_NFT_ABI } from '@/lib/wagmi';

const RPC_MODE_KEY = 'dapp-e2e.wagmi-rainbow.rpc-mode';
const HEALTHY_RPC_URL = 'http://127.0.0.1:8545';
const BROKEN_RPC_URL = 'http://127.0.0.1:1';

function readStoredRpcMode(): 'healthy' | 'broken' {
  if (typeof window === 'undefined') return 'healthy';
  return window.localStorage.getItem(RPC_MODE_KEY) === 'broken' ? 'broken' : 'healthy';
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending: isMinting } = useWriteContract();
  const [rpcMode, setRpcMode] = useState<'healthy' | 'broken'>('healthy');
  const [rpcError, setRpcError] = useState<string>('');
  const [recoveryBalance, setRecoveryBalance] = useState<string>('(loading)');

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MINT_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MINT_NFT_ABI,
    functionName: 'totalSupply',
  });

  useEffect(() => {
    setRpcMode(readStoredRpcMode());
  }, []);

  useEffect(() => {
    if (!address) {
      setRecoveryBalance('(disconnected)');
      setRpcError('');
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      const rpcUrl = rpcMode === 'healthy' ? HEALTHY_RPC_URL : BROKEN_RPC_URL;
      const client = createPublicClient({
        transport: http(rpcUrl, { retryCount: 0, timeout: 1_000 }),
      });
      try {
        const nextBalance = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: MINT_NFT_ABI,
          functionName: 'balanceOf',
          args: [address],
        });
        if (cancelled) return;
        setRecoveryBalance(String(nextBalance));
        setRpcError('');
      } catch (error) {
        if (cancelled) return;
        setRecoveryBalance('(error)');
        setRpcError(error instanceof Error ? error.message.slice(0, 120) : String(error));
      }
    };

    void refresh();
    const interval = setInterval(() => void refresh(), 1_500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address, rpcMode]);

  const setStoredRpcMode = (mode: 'healthy' | 'broken') => {
    window.localStorage.setItem(RPC_MODE_KEY, mode);
    setRpcMode(mode);
  };

  const onMint = () => {
    if (!address) return;
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: MINT_NFT_ABI,
        functionName: 'mint',
        args: [address],
      },
      {
        onSuccess: () => {
          setTimeout(() => {
            void refetchBalance();
            void refetchSupply();
          }, 800);
        },
      },
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Mint Demo</h1>
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
          address: {address ?? '(none)'}
        </div>
        <div data-testid="my-balance">
          balance: {balance !== undefined ? String(balance) : '(loading)'}
        </div>
        <div data-testid="recovery-balance">recoveryBalance: {recoveryBalance}</div>
        <div data-testid="total-supply">
          totalSupply: {totalSupply !== undefined ? String(totalSupply) : '(loading)'}
        </div>
        <div data-testid="rpc-mode">rpcMode: {rpcMode}</div>
        <div data-testid="rpc-error">rpcError: {rpcError || '(none)'}</div>
        <button
          data-testid="mint-button"
          onClick={onMint}
          disabled={!isConnected || isMinting}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            borderRadius: 8,
            border: 'none',
            background: isConnected ? '#7C3AED' : '#aaa',
            color: 'white',
            cursor: isConnected ? 'pointer' : 'not-allowed',
          }}
        >
          {isMinting ? 'Minting...' : 'Mint NFT'}
        </button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="break-rpc-button"
            onClick={() => setStoredRpcMode('broken')}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              borderRadius: 8,
              border: '1px solid #DC2626',
              background: '#FEF2F2',
              color: '#991B1B',
            }}
          >
            Break RPC
          </button>
          <button
            data-testid="restore-rpc-button"
            onClick={() => setStoredRpcMode('healthy')}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              borderRadius: 8,
              border: '1px solid #0F766E',
              background: '#ECFDF5',
              color: '#115E59',
            }}
          >
            Restore RPC
          </button>
        </div>
      </section>
    </main>
  );
}
