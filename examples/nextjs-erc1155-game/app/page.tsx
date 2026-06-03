'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, GAME_ITEMS_ABI, ITEM_IDS, ITEM_NAMES } from '@/lib/wagmi';

const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [refetchTick, setRefetchTick] = useState(0);

  const myInventory = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ITEMS_ABI,
    functionName: 'balanceOfBatch',
    args: address
      ? [
          [address, address, address] as const,
          [ITEM_IDS[0], ITEM_IDS[1], ITEM_IDS[2]] as const,
        ]
      : undefined,
    query: { enabled: Boolean(address), refetchInterval: refetchTick > 0 ? 0 : undefined },
  });

  const recipientInventory = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ITEMS_ABI,
    functionName: 'balanceOfBatch',
    args: [
      [RECIPIENT, RECIPIENT, RECIPIENT] as const,
      [ITEM_IDS[0], ITEM_IDS[1], ITEM_IDS[2]] as const,
    ],
  });

  const refetchAll = () => {
    setTimeout(() => {
      void myInventory.refetch();
      void recipientInventory.refetch();
      setRefetchTick((n) => n + 1);
    }, 800);
  };

  const onMintOne = (idx: number) => {
    if (!address) return;
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: GAME_ITEMS_ABI,
        functionName: 'mint',
        args: [address, ITEM_IDS[idx], 1n],
      },
      { onSuccess: refetchAll },
    );
  };

  const onMintBatch = () => {
    if (!address) return;
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: GAME_ITEMS_ABI,
        functionName: 'mintBatch',
        args: [address, [...ITEM_IDS], [3n, 2n, 5n]],
      },
      { onSuccess: refetchAll },
    );
  };

  const onBatchTransfer = () => {
    if (!address) return;
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: GAME_ITEMS_ABI,
        functionName: 'safeBatchTransferFrom',
        args: [address, RECIPIENT, [...ITEM_IDS], [1n, 1n, 1n]],
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e ERC1155 Game</h1>
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
        <div data-testid="my-inventory">
          my:{' '}
          {myInventory.data
            ? ITEM_NAMES.map((name, i) => `${name}=${myInventory.data?.[i] ?? 0n}`).join(', ')
            : '(loading)'}
        </div>
        <div data-testid="recipient-inventory">
          recipient:{' '}
          {recipientInventory.data
            ? ITEM_NAMES.map(
                (name, i) => `${name}=${recipientInventory.data?.[i] ?? 0n}`,
              ).join(', ')
            : '(loading)'}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {ITEM_NAMES.map((name, idx) => (
            <button
              key={name}
              data-testid={`mint-${name.toLowerCase()}-button`}
              onClick={() => onMintOne(idx)}
              disabled={!isConnected || isPending}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ccc' }}
            >
              Mint {name}
            </button>
          ))}
        </div>

        <button
          data-testid="mint-batch-button"
          onClick={onMintBatch}
          disabled={!isConnected || isPending}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: '#7C3AED',
            color: 'white',
            cursor: isConnected ? 'pointer' : 'not-allowed',
          }}
        >
          Mint Batch (Sword x3 + Shield x2 + Potion x5)
        </button>

        <button
          data-testid="batch-transfer-button"
          onClick={onBatchTransfer}
          disabled={!isConnected || isPending}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: '#059669',
            color: 'white',
            cursor: isConnected ? 'pointer' : 'not-allowed',
          }}
        >
          Batch Transfer 1+1+1 to Recipient
        </button>
      </section>
    </main>
  );
}
