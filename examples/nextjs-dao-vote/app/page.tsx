'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import {
  VOTE_TOKEN,
  DAO,
  VOTE_TOKEN_ABI,
  DAO_ABI,
  STATE_LABEL,
} from '@/lib/wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [proposalId, setProposalId] = useState<bigint>(0n);
  const [tick, setTick] = useState(0);

  const myVotes = useReadContract({
    address: VOTE_TOKEN,
    abi: VOTE_TOKEN_ABI,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });

  const proposalCount = useReadContract({
    address: DAO,
    abi: DAO_ABI,
    functionName: 'proposalCount',
    query: { staleTime: 0 },
  });

  const proposalState = useReadContract({
    address: DAO,
    abi: DAO_ABI,
    functionName: 'state',
    args: proposalId > 0n ? [proposalId] : undefined,
    query: { enabled: proposalId > 0n, staleTime: 0 },
  });

  const proposalDetail = useReadContract({
    address: DAO,
    abi: DAO_ABI,
    functionName: 'proposalView',
    args: proposalId > 0n ? [proposalId] : undefined,
    query: { enabled: proposalId > 0n, staleTime: 0 },
  });

  void tick;

  const refetchAll = () =>
    setTimeout(() => {
      void myVotes.refetch();
      void proposalCount.refetch();
      void proposalState.refetch();
      void proposalDetail.refetch();
      setTick((n) => n + 1);
    }, 800);

  const onDelegate = () => {
    if (!address) return;
    writeContract(
      {
        address: VOTE_TOKEN,
        abi: VOTE_TOKEN_ABI,
        functionName: 'delegate',
        args: [address],
      },
      { onSuccess: refetchAll },
    );
  };

  const onPropose = () => {
    writeContract(
      {
        address: DAO,
        abi: DAO_ABI,
        functionName: 'propose',
        args: [`Proposal #${Date.now()}`],
      },
      {
        onSuccess: () => {
          setTimeout(async () => {
            const r = await proposalCount.refetch();
            if (r.data) setProposalId(r.data as bigint);
            refetchAll();
          }, 800);
        },
      },
    );
  };

  const onVote = (support: 0 | 1 | 2) => {
    if (proposalId === 0n) return;
    writeContract(
      {
        address: DAO,
        abi: DAO_ABI,
        functionName: 'castVote',
        args: [proposalId, support],
      },
      { onSuccess: refetchAll },
    );
  };

  const stateNum = proposalState.data as number | undefined;
  const detail = proposalDetail.data as
    | readonly [`0x${string}`, bigint, bigint, bigint, bigint, bigint]
    | undefined;

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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e DAO Vote</h1>
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
        <div data-testid="my-votes">
          myVotes: {myVotes.data !== undefined ? String(myVotes.data) : '(loading)'}
        </div>
        <div data-testid="proposal-count">
          proposalCount:{' '}
          {proposalCount.data !== undefined ? String(proposalCount.data) : '(loading)'}
        </div>
        <div data-testid="current-proposal-id">currentId: {String(proposalId)}</div>
        <div data-testid="proposal-state">
          state: {stateNum !== undefined ? STATE_LABEL[stateNum] ?? `unknown(${stateNum})` : '(none)'}
        </div>
        <div data-testid="for-votes">
          forVotes: {detail ? String(detail[3]) : '(none)'}
        </div>
        <div data-testid="against-votes">
          againstVotes: {detail ? String(detail[4]) : '(none)'}
        </div>
        <div data-testid="abstain-votes">
          abstainVotes: {detail ? String(detail[5]) : '(none)'}
        </div>

        <button
          data-testid="delegate-button"
          onClick={onDelegate}
          disabled={!isConnected || isPending}
          style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #ccc' }}
        >
          Delegate to Self
        </button>
        <button
          data-testid="propose-button"
          onClick={onPropose}
          disabled={!isConnected || isPending}
          style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #ccc' }}
        >
          Create Proposal
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            data-testid="vote-for-button"
            onClick={() => onVote(1)}
            disabled={!isConnected || isPending || proposalId === 0n}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#059669',
              color: 'white',
            }}
          >
            Vote For
          </button>
          <button
            data-testid="vote-against-button"
            onClick={() => onVote(0)}
            disabled={!isConnected || isPending || proposalId === 0n}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#DC2626',
              color: 'white',
            }}
          >
            Vote Against
          </button>
          <button
            data-testid="vote-abstain-button"
            onClick={() => onVote(2)}
            disabled={!isConnected || isPending || proposalId === 0n}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#6B7280',
              color: 'white',
            }}
          >
            Vote Abstain
          </button>
        </div>
      </section>
    </main>
  );
}
