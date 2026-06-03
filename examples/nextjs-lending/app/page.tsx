'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import {
  COLLATERAL,
  BORROW,
  LENDING,
  ERC20_ABI,
  LENDING_ABI,
  SUPPLY_AMOUNT,
  BORROW_AMOUNT,
} from '@/lib/wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [tick, setTick] = useState(0);
  void tick;

  const collateralBalance = useReadContract({
    address: COLLATERAL,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const borrowBalance = useReadContract({
    address: BORROW,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const supplied = useReadContract({
    address: LENDING,
    abi: LENDING_ABI,
    functionName: 'collateralBalance',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const debt = useReadContract({
    address: LENDING,
    abi: LENDING_ABI,
    functionName: 'debtBalance',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const hf = useReadContract({
    address: LENDING,
    abi: LENDING_ABI,
    functionName: 'healthFactor',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });

  const refetchAll = () =>
    setTimeout(() => {
      void collateralBalance.refetch();
      void borrowBalance.refetch();
      void supplied.refetch();
      void debt.refetch();
      void hf.refetch();
      setTick((n) => n + 1);
    }, 800);

  const onApproveCollateral = () => {
    writeContract(
      {
        address: COLLATERAL,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [LENDING, SUPPLY_AMOUNT],
      },
      { onSuccess: refetchAll },
    );
  };

  const onApproveBorrow = () => {
    writeContract(
      {
        address: BORROW,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [LENDING, BORROW_AMOUNT],
      },
      { onSuccess: refetchAll },
    );
  };

  const onSupply = () => {
    writeContract(
      {
        address: LENDING,
        abi: LENDING_ABI,
        functionName: 'supply',
        args: [SUPPLY_AMOUNT],
      },
      { onSuccess: refetchAll },
    );
  };

  const onBorrow = () => {
    writeContract(
      {
        address: LENDING,
        abi: LENDING_ABI,
        functionName: 'borrow',
        args: [BORROW_AMOUNT],
      },
      { onSuccess: refetchAll },
    );
  };

  const onRepay = () => {
    writeContract(
      {
        address: LENDING,
        abi: LENDING_ABI,
        functionName: 'repay',
        args: [BORROW_AMOUNT],
      },
      { onSuccess: refetchAll },
    );
  };

  const formatHF = (v: bigint | undefined) => {
    if (v === undefined) return '(loading)';
    if (v >= 10n ** 30n) return '∞ (no debt)';
    return String(v);
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Lending</h1>
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
        <div data-testid="collateral-balance">
          collBalance:{' '}
          {collateralBalance.data !== undefined ? String(collateralBalance.data) : '(loading)'}
        </div>
        <div data-testid="borrow-balance">
          borrowBalance:{' '}
          {borrowBalance.data !== undefined ? String(borrowBalance.data) : '(loading)'}
        </div>
        <div data-testid="supplied">
          supplied: {supplied.data !== undefined ? String(supplied.data) : '(loading)'}
        </div>
        <div data-testid="debt">
          debt: {debt.data !== undefined ? String(debt.data) : '(loading)'}
        </div>
        <div data-testid="health-factor">
          healthFactor: {formatHF(hf.data as bigint | undefined)}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            data-testid="approve-collateral-button"
            onClick={onApproveCollateral}
            disabled={!isConnected || isPending}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ccc' }}
          >
            Approve Collateral
          </button>
          <button
            data-testid="supply-button"
            onClick={onSupply}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#7C3AED',
              color: 'white',
            }}
          >
            Supply
          </button>
          <button
            data-testid="borrow-button"
            onClick={onBorrow}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#059669',
              color: 'white',
            }}
          >
            Borrow
          </button>
          <button
            data-testid="approve-borrow-button"
            onClick={onApproveBorrow}
            disabled={!isConnected || isPending}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ccc' }}
          >
            Approve Borrow
          </button>
          <button
            data-testid="repay-button"
            onClick={onRepay}
            disabled={!isConnected || isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#DC2626',
              color: 'white',
            }}
          >
            Repay
          </button>
        </div>
      </section>
    </main>
  );
}
