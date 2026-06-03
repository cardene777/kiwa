'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { keccak256, encodePacked, type Hex } from 'viem';
import { VERIFIER, VERIFIER_ABI } from '@/lib/wagmi';

const FIXED_SECRET: Hex =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const FIXED_MESSAGE = 'hello-zk';
const WRONG_SECRET: Hex =
  '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

function computeCommitment(secret: Hex, message: string): Hex {
  return keccak256(encodePacked(['bytes32', 'string'], [secret, message]));
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [tick, setTick] = useState(0);
  const [computed, setComputed] = useState<Hex>(computeCommitment(FIXED_SECRET, FIXED_MESSAGE));
  const [lastError, setLastError] = useState<string>('');
  void tick;

  const stored = useReadContract({
    address: VERIFIER,
    abi: VERIFIER_ABI,
    functionName: 'commitments',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const verified = useReadContract({
    address: VERIFIER,
    abi: VERIFIER_ABI,
    functionName: 'verifiedCount',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const total = useReadContract({
    address: VERIFIER,
    abi: VERIFIER_ABI,
    functionName: 'totalVerified',
    query: { staleTime: 0, refetchInterval: 1500 },
  });

  const refetchAll = () =>
    setTimeout(() => {
      void stored.refetch();
      void verified.refetch();
      void total.refetch();
      setTick((n) => n + 1);
    }, 800);

  const onSetCommitment = () => {
    setLastError('');
    const c = computeCommitment(FIXED_SECRET, FIXED_MESSAGE);
    setComputed(c);
    writeContract(
      {
        address: VERIFIER,
        abi: VERIFIER_ABI,
        functionName: 'setCommitment',
        args: [c],
      },
      { onSuccess: refetchAll },
    );
  };

  const onVerifyValid = () => {
    setLastError('');
    writeContract(
      {
        address: VERIFIER,
        abi: VERIFIER_ABI,
        functionName: 'verify',
        args: [FIXED_SECRET, FIXED_MESSAGE],
      },
      {
        onSuccess: refetchAll,
        onError: (e) => setLastError(`valid-failed: ${e.message.slice(0, 80)}`),
      },
    );
  };

  const onVerifyInvalid = () => {
    setLastError('');
    writeContract(
      {
        address: VERIFIER,
        abi: VERIFIER_ABI,
        functionName: 'verify',
        args: [WRONG_SECRET, FIXED_MESSAGE],
      },
      {
        onSuccess: refetchAll,
        onError: (e) => setLastError(`invalid-rejected: ${e.message.slice(0, 80)}`),
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e ZK Verifier</h1>
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
        <div data-testid="computed-commitment">
          computed: {computed}
        </div>
        <div data-testid="stored-commitment">
          stored: {stored.data !== undefined ? String(stored.data) : '(loading)'}
        </div>
        <div data-testid="matches">
          matches: {stored.data !== undefined ? (stored.data === computed ? 'true' : 'false') : '(loading)'}
        </div>
        <div data-testid="verified-count">
          verifiedCount: {verified.data !== undefined ? String(verified.data) : '(loading)'}
        </div>
        <div data-testid="total-verified">
          totalVerified: {total.data !== undefined ? String(total.data) : '(loading)'}
        </div>
        <div data-testid="last-error">lastError: {lastError || '(none)'}</div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="set-commitment-button"
            onClick={onSetCommitment}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#7C3AED',
              color: 'white',
            }}
          >
            Set Commitment
          </button>
          <button
            data-testid="verify-valid-button"
            onClick={onVerifyValid}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#059669',
              color: 'white',
            }}
          >
            Verify (valid)
          </button>
          <button
            data-testid="verify-invalid-button"
            onClick={onVerifyInvalid}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#DC2626',
              color: 'white',
            }}
          >
            Verify (invalid)
          </button>
        </div>
      </section>
    </main>
  );
}
