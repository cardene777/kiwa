'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { keccak256, encodePacked, type Hex } from 'viem';
import { RANGE_VERIFIER, RANGE_VERIFIER_ABI, VERIFIER, VERIFIER_ABI } from '@/lib/wagmi';

const FIXED_SECRET: Hex =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const FIXED_MESSAGE = 'hello-zk';
const WRONG_SECRET: Hex =
  '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
const RANGE_SALT: Hex =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const WRONG_RANGE_SALT: Hex =
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const RANGE_MIN = 10n;
const RANGE_MAX = 100n;
const RANGE_VALUE = 42n;

function computeCommitment(secret: Hex, message: string): Hex {
  return keccak256(encodePacked(['bytes32', 'string'], [secret, message]));
}

function computeRangeCommitment(value: bigint, salt: Hex): Hex {
  return keccak256(encodePacked(['uint256', 'bytes32'], [value, salt]));
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [tick, setTick] = useState(0);
  const [computed, setComputed] = useState<Hex>(computeCommitment(FIXED_SECRET, FIXED_MESSAGE));
  const [lastError, setLastError] = useState<string>('');
  const [rangeComputed, setRangeComputed] = useState<Hex>(
    computeRangeCommitment(RANGE_VALUE, RANGE_SALT),
  );
  const [rangeError, setRangeError] = useState<string>('');
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

  const rangeStored = useReadContract({
    address: RANGE_VERIFIER,
    abi: RANGE_VERIFIER_ABI,
    functionName: 'rangeCommitments',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const rangeMin = useReadContract({
    address: RANGE_VERIFIER,
    abi: RANGE_VERIFIER_ABI,
    functionName: 'minValues',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const rangeMax = useReadContract({
    address: RANGE_VERIFIER,
    abi: RANGE_VERIFIER_ABI,
    functionName: 'maxValues',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const rangeVerified = useReadContract({
    address: RANGE_VERIFIER,
    abi: RANGE_VERIFIER_ABI,
    functionName: 'verifiedCount',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const rangeTotal = useReadContract({
    address: RANGE_VERIFIER,
    abi: RANGE_VERIFIER_ABI,
    functionName: 'totalVerified',
    query: { staleTime: 0, refetchInterval: 1500 },
  });

  const refetchAll = () =>
    setTimeout(() => {
      void stored.refetch();
      void verified.refetch();
      void total.refetch();
      void rangeStored.refetch();
      void rangeMin.refetch();
      void rangeMax.refetch();
      void rangeVerified.refetch();
      void rangeTotal.refetch();
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

  const onSetRangeCommitment = () => {
    setRangeError('');
    const commitment = computeRangeCommitment(RANGE_VALUE, RANGE_SALT);
    setRangeComputed(commitment);
    writeContract(
      {
        address: RANGE_VERIFIER,
        abi: RANGE_VERIFIER_ABI,
        functionName: 'setRangeCommitment',
        args: [commitment, RANGE_MIN, RANGE_MAX],
      },
      { onSuccess: refetchAll },
    );
  };

  const onVerifyRangeValid = () => {
    setRangeError('');
    writeContract(
      {
        address: RANGE_VERIFIER,
        abi: RANGE_VERIFIER_ABI,
        functionName: 'verifyRange',
        args: [RANGE_VALUE, RANGE_SALT],
      },
      {
        onSuccess: refetchAll,
        onError: (e) => setRangeError(`range-valid-failed: ${e.message.slice(0, 80)}`),
      },
    );
  };

  const onVerifyRangeInvalid = () => {
    setRangeError('');
    writeContract(
      {
        address: RANGE_VERIFIER,
        abi: RANGE_VERIFIER_ABI,
        functionName: 'verifyRange',
        args: [RANGE_VALUE, WRONG_RANGE_SALT],
      },
      {
        onSuccess: refetchAll,
        onError: (e) => setRangeError(`range-invalid-rejected: ${e.message.slice(0, 80)}`),
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
        <h2 style={{ fontSize: 20, margin: 0 }}>Range Proof Variant</h2>
        <div data-testid="range-computed-commitment">
          rangeComputed: {rangeComputed}
        </div>
        <div data-testid="range-stored-commitment">
          rangeStored: {rangeStored.data !== undefined ? String(rangeStored.data) : '(loading)'}
        </div>
        <div data-testid="range-bounds">
          rangeBounds:{' '}
          {rangeMin.data !== undefined && rangeMax.data !== undefined
            ? `${String(rangeMin.data)}-${String(rangeMax.data)}`
            : '(loading)'}
        </div>
        <div data-testid="range-matches">
          rangeMatches:{' '}
          {rangeStored.data !== undefined ? (rangeStored.data === rangeComputed ? 'true' : 'false') : '(loading)'}
        </div>
        <div data-testid="range-verified-count">
          rangeVerifiedCount:{' '}
          {rangeVerified.data !== undefined ? String(rangeVerified.data) : '(loading)'}
        </div>
        <div data-testid="range-total-verified">
          rangeTotalVerified: {rangeTotal.data !== undefined ? String(rangeTotal.data) : '(loading)'}
        </div>
        <div data-testid="range-last-error">rangeLastError: {rangeError || '(none)'}</div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="set-range-commitment-button"
            onClick={onSetRangeCommitment}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#0F766E',
              color: 'white',
            }}
          >
            Set Range Commitment
          </button>
          <button
            data-testid="verify-range-valid-button"
            onClick={onVerifyRangeValid}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#2563EB',
              color: 'white',
            }}
          >
            Verify Range (valid)
          </button>
          <button
            data-testid="verify-range-invalid-button"
            onClick={onVerifyRangeInvalid}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#B91C1C',
              color: 'white',
            }}
          >
            Verify Range (invalid)
          </button>
        </div>
      </section>
    </main>
  );
}
