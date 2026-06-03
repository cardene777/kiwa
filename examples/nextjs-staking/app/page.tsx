'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import {
  STAKE_TOKEN,
  REWARD_TOKEN,
  STAKING,
  ERC20_ABI,
  STAKING_ABI,
  STAKE_AMOUNT,
} from '@/lib/wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [tick, setTick] = useState(0);
  void tick;

  const stakeBalance = useReadContract({
    address: STAKE_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const rewardBalance = useReadContract({
    address: REWARD_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const staked = useReadContract({
    address: STAKING,
    abi: STAKING_ABI,
    functionName: 'stakedBalance',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const pending = useReadContract({
    address: STAKING,
    abi: STAKING_ABI,
    functionName: 'pendingReward',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0, refetchInterval: 1500 },
  });

  const refetchAll = () =>
    setTimeout(() => {
      void stakeBalance.refetch();
      void rewardBalance.refetch();
      void staked.refetch();
      void pending.refetch();
      setTick((n) => n + 1);
    }, 800);

  const onApprove = () => {
    writeContract(
      {
        address: STAKE_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [STAKING, STAKE_AMOUNT],
      },
      { onSuccess: refetchAll },
    );
  };
  const onStake = () => {
    writeContract(
      {
        address: STAKING,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [STAKE_AMOUNT],
      },
      { onSuccess: refetchAll },
    );
  };
  const onClaim = () => {
    writeContract(
      {
        address: STAKING,
        abi: STAKING_ABI,
        functionName: 'claim',
      },
      { onSuccess: refetchAll },
    );
  };
  const onUnstake = () => {
    writeContract(
      {
        address: STAKING,
        abi: STAKING_ABI,
        functionName: 'unstake',
        args: [STAKE_AMOUNT],
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Staking</h1>
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
        <div data-testid="stake-balance">
          stakeBalance:{' '}
          {stakeBalance.data !== undefined ? String(stakeBalance.data) : '(loading)'}
        </div>
        <div data-testid="reward-balance">
          rewardBalance:{' '}
          {rewardBalance.data !== undefined ? String(rewardBalance.data) : '(loading)'}
        </div>
        <div data-testid="staked">
          staked: {staked.data !== undefined ? String(staked.data) : '(loading)'}
        </div>
        <div data-testid="pending-reward">
          pendingReward: {pending.data !== undefined ? String(pending.data) : '(loading)'}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="approve-button"
            onClick={onApprove}
            disabled={!isConnected || isPending}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ccc' }}
          >
            Approve
          </button>
          <button
            data-testid="stake-button"
            onClick={onStake}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#7C3AED',
              color: 'white',
            }}
          >
            Stake
          </button>
          <button
            data-testid="claim-button"
            onClick={onClaim}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#059669',
              color: 'white',
            }}
          >
            Claim
          </button>
          <button
            data-testid="unstake-button"
            onClick={onUnstake}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#DC2626',
              color: 'white',
            }}
          >
            Unstake
          </button>
        </div>
      </section>
    </main>
  );
}
