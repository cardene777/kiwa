'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, usePublicClient, useReadContract, useWalletClient } from 'wagmi';
import {
  buildExecuteCallData,
  buildFactoryInitCode,
  buildUnsignedUserOperation,
  INCREMENT_CALLDATA,
  signUserOperation,
  userOperationToJson,
} from '@/lib/aa';
import {
  ACCOUNT_SALT,
  ENTRY_POINT,
  FACTORY,
  MOCK_TARGET,
  MOCK_TARGET_ABI,
  OWNER,
  SIMPLE_ACCOUNT_ABI,
} from '@/lib/wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deployment = useQuery({
    queryKey: ['deployment', address],
    enabled: Boolean(address && publicClient),
    refetchInterval: 1_500,
    queryFn: async () => {
      if (!address || !publicClient) {
        return false;
      }
      const code = await publicClient.getBytecode({ address });
      return Boolean(code);
    },
  });

  const counter = useReadContract({
    address: MOCK_TARGET,
    abi: MOCK_TARGET_ABI,
    functionName: 'counter',
    query: { staleTime: 0, refetchInterval: 1_500 },
  });

  const nonce = useReadContract({
    address: address,
    abi: SIMPLE_ACCOUNT_ABI,
    functionName: 'nonce',
    query: {
      enabled: Boolean(address && deployment.data),
      staleTime: 0,
      refetchInterval: 1_500,
      retry: false,
    },
  });

  const refresh = async () => {
    await Promise.all([
      deployment.refetch(),
      counter.refetch(),
      nonce.refetch(),
    ]);
  };

  const onIncrement = async () => {
    if (!address || !walletClient || !publicClient) {
      return;
    }

    setIsSubmitting(true);
    setStatus('signing');

    try {
      const unsignedUserOp = buildUnsignedUserOperation({
        sender: address,
        nonce: deployment.data ? ((nonce.data as bigint | undefined) ?? 0n) : 0n,
        initCode: deployment.data
          ? '0x'
          : buildFactoryInitCode(FACTORY, OWNER, ACCOUNT_SALT),
        callData: buildExecuteCallData(MOCK_TARGET, INCREMENT_CALLDATA),
      });

      const signedUserOp = await signUserOperation(
        walletClient,
        publicClient,
        ENTRY_POINT,
        unsignedUserOp,
      );

      setStatus('sending');

      const response = await fetch('/api/user-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userOp: userOperationToJson(signedUserOp) }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `request failed with status ${response.status}`);
      }

      setStatus('confirmed');
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(254, 240, 138, 0.65), transparent 35%), linear-gradient(180deg, #0f172a 0%, #111827 48%, #020617 100%)',
        color: '#f8fafc',
        padding: '32px 16px 64px',
      }}
    >
      <section
        style={{
          maxWidth: 860,
          margin: '0 auto',
          display: 'grid',
          gap: 24,
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#fbbf24' }}>
              ERC-4337 v0.7
            </div>
            <h1 style={{ margin: '8px 0 0', fontSize: 34 }}>Minimal Account Abstraction Flow</h1>
          </div>
          <ConnectButton />
        </header>

        <section
          style={{
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: 24,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.72)',
            boxShadow: '0 24px 80px rgba(2, 6, 23, 0.45)',
            display: 'grid',
            gap: 16,
          }}
        >
          <div data-testid="connection-status">status: {isConnected ? 'connected' : 'disconnected'}</div>
          <div data-testid="connected-address">smartAccount: {address ?? '(disconnected)'}</div>
          <div data-testid="deployment-status">
            isDeployed: {deployment.data === undefined ? '(loading)' : deployment.data ? 'true' : 'false'}
          </div>
          <div data-testid="nonce">nonce: {nonce.data !== undefined ? String(nonce.data) : '0'}</div>
          <div data-testid="counter">counter: {counter.data !== undefined ? String(counter.data) : '(loading)'}</div>
          <div data-testid="userop-status">userOpStatus: {status}</div>

          <button
            type="button"
            data-testid="increment-button"
            onClick={() => void onIncrement()}
            disabled={!isConnected || !walletClient || !publicClient || isSubmitting}
            style={{
              width: 'fit-content',
              padding: '12px 18px',
              borderRadius: 999,
              border: '1px solid rgba(245, 158, 11, 0.6)',
              background: isSubmitting ? '#475569' : '#f59e0b',
              color: '#020617',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Submitting UserOperation...' : 'Increment via UserOperation'}
          </button>
        </section>
      </section>
    </main>
  );
}
