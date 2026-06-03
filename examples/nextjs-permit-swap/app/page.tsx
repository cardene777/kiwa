'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useChainId,
  useReadContract,
  useSignTypedData,
  useWriteContract,
} from 'wagmi';
import {
  TOKEN_A,
  TOKEN_B,
  SWAP,
  TOKEN_A_NAME,
  PERMIT_TOKEN_ABI,
  PERMIT_SWAP_ABI,
  SWAP_AMOUNT,
} from '@/lib/wagmi';

const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

interface PermitSig {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
  deadline: bigint;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();
  const { writeContract, isPending: isSwapping } = useWriteContract();
  const [permitSig, setPermitSig] = useState<PermitSig | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tick, setTick] = useState(0);

  const balanceA = useReadContract({
    address: TOKEN_A,
    abi: PERMIT_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const balanceB = useReadContract({
    address: TOKEN_B,
    abi: PERMIT_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  const nonce = useReadContract({
    address: TOKEN_A,
    abi: PERMIT_TOKEN_ABI,
    functionName: 'nonces',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), staleTime: 0 },
  });
  void tick;

  const onSignPermit = async () => {
    setErrorMessage('');
    if (!address || nonce.data === undefined) return;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    try {
      const signature = await signTypedDataAsync({
        domain: {
          name: TOKEN_A_NAME,
          version: '1',
          chainId,
          verifyingContract: TOKEN_A,
        },
        types: PERMIT_TYPES,
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: SWAP,
          value: SWAP_AMOUNT,
          nonce: nonce.data as bigint,
          deadline,
        },
      });
      const sig = signature.slice(2);
      setPermitSig({
        r: ('0x' + sig.slice(0, 64)) as `0x${string}`,
        s: ('0x' + sig.slice(64, 128)) as `0x${string}`,
        v: parseInt(sig.slice(128, 130), 16),
        deadline,
      });
    } catch (e) {
      setErrorMessage(`sign-error: ${(e as Error).message}`);
    }
  };

  const onPermitAndSwap = () => {
    if (!permitSig) return;
    setErrorMessage('');
    writeContract(
      {
        address: SWAP,
        abi: PERMIT_SWAP_ABI,
        functionName: 'permitAndSwap',
        args: [SWAP_AMOUNT, permitSig.deadline, permitSig.v, permitSig.r, permitSig.s],
      },
      {
        onSuccess: () => {
          setTimeout(() => {
            void balanceA.refetch();
            void balanceB.refetch();
            void nonce.refetch();
            setTick((n) => n + 1);
          }, 800);
        },
        onError: (e) => {
          setErrorMessage(`swap-error: ${e.message.slice(0, 100)}`);
        },
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Permit Swap</h1>
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
        <div data-testid="balance-a">
          tokenA: {balanceA.data !== undefined ? String(balanceA.data) : '(loading)'}
        </div>
        <div data-testid="balance-b">
          tokenB: {balanceB.data !== undefined ? String(balanceB.data) : '(loading)'}
        </div>
        <div data-testid="nonce">
          nonce: {nonce.data !== undefined ? String(nonce.data) : '(loading)'}
        </div>
        <div data-testid="permit-sig">
          permitSig: {permitSig ? `${permitSig.v}|${permitSig.r.slice(0, 10)}...` : '(none)'}
        </div>
        <div data-testid="error-message">{errorMessage}</div>

        <button
          data-testid="sign-permit-button"
          onClick={onSignPermit}
          disabled={!isConnected || isSigning}
          style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #ccc' }}
        >
          {isSigning ? 'Signing...' : 'Sign Permit'}
        </button>
        <button
          data-testid="permit-swap-button"
          onClick={onPermitAndSwap}
          disabled={!permitSig || isSwapping}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: permitSig ? '#7C3AED' : '#aaa',
            color: 'white',
            cursor: permitSig ? 'pointer' : 'not-allowed',
          }}
        >
          {isSwapping ? 'Swapping...' : 'Permit + Swap (1 tx)'}
        </button>
      </section>
    </main>
  );
}
