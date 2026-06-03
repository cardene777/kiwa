'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import {
  FACTORY,
  PAYMASTER,
  COUNTER,
  FACTORY_ABI,
  SMART_ACCOUNT_ABI,
  PAYMASTER_ABI,
  COUNTER_ABI,
  INCREMENT_SELECTOR,
  SALT,
} from '@/lib/wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [tick, setTick] = useState(0);
  void tick;

  // smart account address を counterfactual に計算
  const predictedAccount = useReadContract({
    address: FACTORY,
    abi: FACTORY_ABI,
    functionName: 'getAddress',
    args: address ? [address, SALT] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });

  const accountAddress = predictedAccount.data as `0x${string}` | undefined;

  // smart account 経由の counter call 回数
  const accountCount = useReadContract({
    address: COUNTER,
    abi: COUNTER_ABI,
    functionName: 'countByCaller',
    args: accountAddress ? [accountAddress] : undefined,
    query: { enabled: Boolean(accountAddress), staleTime: 0, refetchInterval: 1500 },
  });

  // paymaster の sponsoredCount
  const sponsoredCount = useReadContract({
    address: PAYMASTER,
    abi: PAYMASTER_ABI,
    functionName: 'sponsoredCount',
    query: { staleTime: 0, refetchInterval: 1500 },
  });

  // smart account の owner (deploy 後は EOA アドレス、deploy 前は 0x0 = call revert)
  const accountOwner = useReadContract({
    address: accountAddress,
    abi: SMART_ACCOUNT_ABI,
    functionName: 'owner',
    query: { enabled: Boolean(accountAddress), staleTime: 0, refetchInterval: 1500, retry: false },
  });

  const refetchAll = () =>
    setTimeout(() => {
      void accountCount.refetch();
      void sponsoredCount.refetch();
      void accountOwner.refetch();
      setTick((n) => n + 1);
    }, 800);

  const onDeployAccount = () => {
    if (!address) return;
    writeContract(
      {
        address: FACTORY,
        abi: FACTORY_ABI,
        functionName: 'createAccount',
        args: [address, SALT],
      },
      { onSuccess: refetchAll },
    );
  };

  const onExecuteViaAccount = () => {
    if (!accountAddress) return;
    writeContract(
      {
        address: accountAddress,
        abi: SMART_ACCOUNT_ABI,
        functionName: 'execute',
        args: [COUNTER, 0n, INCREMENT_SELECTOR],
      },
      { onSuccess: refetchAll },
    );
  };

  const onSponsorExecute = () => {
    if (!accountAddress) return;
    writeContract(
      {
        address: PAYMASTER,
        abi: PAYMASTER_ABI,
        functionName: 'sponsorAndExecute',
        args: [accountAddress, COUNTER, 0n, INCREMENT_SELECTOR],
      },
      { onSuccess: refetchAll },
    );
  };

  const isDeployed = Boolean(accountOwner.data) && accountOwner.data !== undefined;

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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e AA Smart Account</h1>
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
        <div data-testid="predicted-account">
          predictedAccount: {accountAddress ?? '(loading)'}
        </div>
        <div data-testid="is-deployed">
          isDeployed: {accountAddress ? (isDeployed ? 'true' : 'false') : '(loading)'}
        </div>
        <div data-testid="account-count">
          accountCount: {accountCount.data !== undefined ? String(accountCount.data) : '(loading)'}
        </div>
        <div data-testid="sponsored-count">
          sponsoredCount:{' '}
          {sponsoredCount.data !== undefined ? String(sponsoredCount.data) : '(loading)'}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="deploy-account-button"
            onClick={onDeployAccount}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#7C3AED',
              color: 'white',
            }}
          >
            Deploy Smart Account
          </button>
          <button
            data-testid="execute-account-button"
            onClick={onExecuteViaAccount}
            disabled={!isConnected || isPending || !isDeployed}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#059669',
              color: 'white',
            }}
          >
            Execute via Account
          </button>
          <button
            data-testid="sponsor-execute-button"
            onClick={onSponsorExecute}
            disabled={!isConnected || isPending || !isDeployed}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#DC2626',
              color: 'white',
            }}
          >
            Paymaster Sponsor
          </button>
        </div>
      </section>
    </main>
  );
}
