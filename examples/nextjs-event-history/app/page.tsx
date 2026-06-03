'use client';

import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useReadContract,
  useWatchContractEvent,
  useWriteContract,
  usePublicClient,
} from 'wagmi';
import { EMITTER, EMITTER_ABI, LOGGED_EVENT } from '@/lib/wagmi';

interface LogEntry {
  sender: string;
  value: string;
  message: string;
  blockNumber: string;
}

export default function Home() {
  const { isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const publicClient = usePublicClient();
  const [pastLogs, setPastLogs] = useState<LogEntry[]>([]);
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);

  const totalLogs = useReadContract({
    address: EMITTER,
    abi: EMITTER_ABI,
    functionName: 'totalLogs',
    query: { staleTime: 0, refetchInterval: 1500 },
  });

  // past event 取得 (getLogs)
  const refetchPastLogs = async () => {
    if (!publicClient) return;
    const logs = await publicClient.getLogs({
      address: EMITTER,
      event: LOGGED_EVENT,
      fromBlock: 0n,
      toBlock: 'latest',
    });
    setPastLogs(
      logs.map((log) => ({
        sender: String(log.args.sender ?? ''),
        value: String(log.args.value ?? 0n),
        message: String(log.args.message ?? ''),
        blockNumber: String(log.blockNumber ?? 0n),
      })),
    );
  };

  useEffect(() => {
    void refetchPastLogs();
    const interval = setInterval(() => void refetchPastLogs(), 1500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, totalLogs.data]);

  // リアルタイム watchContractEvent (新規 event のみ)
  useWatchContractEvent({
    address: EMITTER,
    abi: EMITTER_ABI,
    eventName: 'Logged',
    onLogs: (logs) => {
      const newEntries = logs.map((log) => {
        const l = log as unknown as {
          args: { sender?: string; value?: bigint; message?: string };
          blockNumber?: bigint;
        };
        return {
          sender: String(l.args.sender ?? ''),
          value: String(l.args.value ?? 0n),
          message: String(l.args.message ?? ''),
          blockNumber: String(l.blockNumber ?? 0n),
        };
      });
      setLiveLogs((prev) => [...prev, ...newEntries]);
    },
  });

  const onEmit = () => {
    writeContract({
      address: EMITTER,
      abi: EMITTER_ABI,
      functionName: 'emitLog',
      args: [BigInt(Date.now() % 1000), `msg-${Date.now()}`],
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Event History</h1>
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
        <div data-testid="total-logs">
          totalLogs: {totalLogs.data !== undefined ? String(totalLogs.data) : '(loading)'}
        </div>
        <div data-testid="past-logs-count">pastLogsCount: {pastLogs.length}</div>
        <div data-testid="live-logs-count">liveLogsCount: {liveLogs.length}</div>
        <button
          data-testid="emit-button"
          onClick={onEmit}
          disabled={!isConnected || isPending}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: '#7C3AED',
            color: 'white',
          }}
        >
          Emit Log
        </button>
      </section>
    </main>
  );
}
