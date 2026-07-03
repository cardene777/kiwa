'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from 'wagmi';
import { formatUnits, parseUnits, type Hex } from 'viem';
import { REORG_TOKEN, REORG_TOKEN_ABI, TRANSFER_EVENT } from '@/lib/wagmi';

const RECIPIENT_ADDRESS =
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const; // anvil account #1

interface TransferEntry {
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  txHash: string;
  removed: boolean;
}

/**
 * ERC-20 transfer UI + past Transfer event history.
 *
 * The e2e harness drives this page to verify anvil_reorg / dropTransaction
 * semantics through wagmi's react hooks. The refetchInterval keeps balance +
 * event list in sync with chain state within 1.5 s of a reorg — the tests
 * assert on that reconvergence.
 */
export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending, data: txHash } = useWriteContract();
  const publicClient = usePublicClient();
  const [pastTransfers, setPastTransfers] = useState<TransferEntry[]>([]);
  const [pendingTxHash, setPendingTxHash] = useState<Hex | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed' | 'dropped'>(
    'idle',
  );

  const senderBalance = useReadContract({
    address: REORG_TOKEN,
    abi: REORG_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      staleTime: 0,
      refetchInterval: 1500,
    },
  });

  const recipientBalance = useReadContract({
    address: REORG_TOKEN,
    abi: REORG_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [RECIPIENT_ADDRESS],
    query: { staleTime: 0, refetchInterval: 1500 },
  });

  const totalSupply = useReadContract({
    address: REORG_TOKEN,
    abi: REORG_TOKEN_ABI,
    functionName: 'totalSupply',
    query: { staleTime: 0, refetchInterval: 1500 },
  });

  const refetchTransfers = useCallback(async () => {
    if (!publicClient) return;
    const logs = await publicClient.getLogs({
      address: REORG_TOKEN,
      event: TRANSFER_EVENT,
      fromBlock: 0n,
      toBlock: 'latest',
    });
    setPastTransfers(
      logs.map((log) => ({
        from: String(log.args.from ?? ''),
        to: String(log.args.to ?? ''),
        value: String(log.args.value ?? 0n),
        blockNumber: String(log.blockNumber ?? 0n),
        txHash: String(log.transactionHash ?? ''),
        removed: Boolean(log.removed),
      })),
    );
  }, [publicClient]);

  useEffect(() => {
    void refetchTransfers();
    const interval = setInterval(() => void refetchTransfers(), 1500);
    return () => clearInterval(interval);
  }, [refetchTransfers, senderBalance.data, recipientBalance.data]);

  // Track tx status through the reorg lifecycle. After the test triggers
  // anvil_reorg the getTransactionReceipt lookup returns null for dropped
  // txs, which the harness observes as the `dropped` state.
  useEffect(() => {
    if (!publicClient || !pendingTxHash) return;
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const receipt = await publicClient.getTransactionReceipt({
          hash: pendingTxHash,
        });
        if (cancelled) return;
        if (receipt.status === 'success') {
          setTxStatus('confirmed');
        } else {
          setTxStatus('dropped');
        }
      } catch {
        if (cancelled) return;
        const tx = await publicClient.getTransaction({ hash: pendingTxHash }).catch(() => null);
        if (cancelled) return;
        if (!tx) {
          setTxStatus('dropped');
        } else {
          setTxStatus('pending');
        }
      }
    };
    void poll();
    const interval = setInterval(() => void poll(), 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicClient, pendingTxHash]);

  useEffect(() => {
    if (txHash) {
      setPendingTxHash(txHash);
      setTxStatus('pending');
    }
  }, [txHash]);

  const onTransfer = () => {
    writeContract({
      address: REORG_TOKEN,
      abi: REORG_TOKEN_ABI,
      functionName: 'transfer',
      args: [RECIPIENT_ADDRESS, parseUnits('1', 18)],
    });
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e-reorg ERC-20 UI</h1>
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
          account: {address ?? '(none)'}
        </div>
        <div data-testid="total-supply">
          totalSupply:{' '}
          {totalSupply.data !== undefined
            ? formatUnits(totalSupply.data as bigint, 18)
            : '(loading)'}
        </div>
        <div data-testid="sender-balance">
          senderBalance:{' '}
          {senderBalance.data !== undefined
            ? formatUnits(senderBalance.data as bigint, 18)
            : '(loading)'}
        </div>
        <div data-testid="recipient-balance">
          recipientBalance:{' '}
          {recipientBalance.data !== undefined
            ? formatUnits(recipientBalance.data as bigint, 18)
            : '(loading)'}
        </div>
        <div data-testid="past-transfers-count">
          pastTransfersCount: {pastTransfers.length}
        </div>
        <div data-testid="past-transfers-removed-count">
          pastTransfersRemovedCount:{' '}
          {pastTransfers.filter((t) => t.removed).length}
        </div>
        <div data-testid="tx-status">txStatus: {txStatus}</div>
        <div data-testid="pending-tx-hash">
          pendingTxHash: {pendingTxHash ?? '(none)'}
        </div>
        <button
          data-testid="transfer-button"
          onClick={onTransfer}
          disabled={!isConnected || isPending}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: '#7C3AED',
            color: 'white',
          }}
        >
          Transfer 1 RRT
        </button>
      </section>
    </main>
  );
}
