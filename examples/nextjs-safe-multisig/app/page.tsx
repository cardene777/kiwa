'use client';

import { useEffect, useRef, useState } from 'react';
import { privateKeyToAccount } from 'viem/accounts';
import type { Address, Hex } from 'viem';
import { SafeMock, SafeProxyFactory, type SafeSignature, type SafeTx } from '@/lib/safe-mock';

// Anvil-default dev accounts. Owner 1 < Owner 2 lexicographically — required
// by the Safe canonical sorted-signers rule the mock enforces.
const OWNER_1_PK: Hex = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const OWNER_2_PK: Hex = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const OWNER_3_PK: Hex = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

const CHAIN_ID = 31337;

const owner1 = privateKeyToAccount(OWNER_1_PK);
const owner2 = privateKeyToAccount(OWNER_2_PK);
const owner3 = privateKeyToAccount(OWNER_3_PK);

type Status = 'idle' | 'pending' | 'success' | 'error';

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [safeAddress, setSafeAddress] = useState<Address | null>(null);
  const [nonce, setNonce] = useState<bigint | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [moduleResult, setModuleResult] = useState<string>('');
  const safeRef = useRef<SafeMock | null>(null);

  useEffect(() => {
    const factory = new SafeProxyFactory(CHAIN_ID);
    const owners = [owner1.address, owner2.address, owner3.address].sort();
    const safe = factory.deploy(owners, 2, 1n);
    safeRef.current = safe;
    setSafeAddress(safe.address);
    setNonce(safe.getNonce());
  }, []);

  const sortedSigners = async (tx: SafeTx, accounts: Array<typeof owner1>): Promise<SafeSignature[]> => {
    const signatures = await Promise.all(
      accounts.map(async (acc) => {
        const signature = await acc.signTypedData({
          domain: { chainId: CHAIN_ID, verifyingContract: safeRef.current!.address },
          types: {
            SafeTx: [
              { name: 'to', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'data', type: 'bytes' },
              { name: 'operation', type: 'uint8' },
              { name: 'safeTxGas', type: 'uint256' },
              { name: 'baseGas', type: 'uint256' },
              { name: 'gasPrice', type: 'uint256' },
              { name: 'gasToken', type: 'address' },
              { name: 'refundReceiver', type: 'address' },
              { name: 'nonce', type: 'uint256' },
            ],
          },
          primaryType: 'SafeTx',
          message: {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            operation: tx.operation,
            safeTxGas: tx.safeTxGas,
            baseGas: tx.baseGas,
            gasPrice: tx.gasPrice,
            gasToken: tx.gasToken,
            refundReceiver: tx.refundReceiver,
            nonce: tx.nonce,
          },
        });
        return { signer: acc.address, signature };
      }),
    );
    return signatures.sort((a, b) =>
      a.signer.toLowerCase() < b.signer.toLowerCase() ? -1 : 1,
    );
  };

  const sampleTx = () => {
    if (!safeRef.current) return null;
    return safeRef.current.propose({
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      value: 0n,
      data: '0x',
    });
  };

  const handleExecOk = async () => {
    if (!safeRef.current) return;
    setStatus('pending');
    setError('');
    try {
      const tx = sampleTx()!;
      const sigs = await sortedSigners(tx, [owner1, owner2]);
      const result = await safeRef.current.execTransaction(tx, sigs);
      setTxHash(result.txHash);
      setNonce(safeRef.current.getNonce());
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  };

  const handleExecBelowThreshold = async () => {
    if (!safeRef.current) return;
    setStatus('pending');
    setError('');
    try {
      const tx = sampleTx()!;
      const sigs = await sortedSigners(tx, [owner1]); // only 1 signature, threshold = 2
      await safeRef.current.execTransaction(tx, sigs);
      // should not reach here
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  };

  const handleExecDuplicate = async () => {
    if (!safeRef.current) return;
    setStatus('pending');
    setError('');
    try {
      const tx = sampleTx()!;
      // Duplicate signature from owner1 (count = 2 but unique = 1)
      const single = await sortedSigners(tx, [owner1]);
      await safeRef.current.execTransaction(tx, [single[0], single[0]]);
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  };

  const handleExecNonceReuse = async () => {
    if (!safeRef.current) return;
    setStatus('pending');
    setError('');
    try {
      const tx = sampleTx()!;
      const sigs = await sortedSigners(tx, [owner1, owner2]);
      await safeRef.current.execTransaction(tx, sigs);

      // try replay with old nonce
      await safeRef.current.execTransaction(tx, sigs);
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  };

  const handleModuleOk = async () => {
    if (!safeRef.current) return;
    setStatus('pending');
    setError('');
    try {
      const moduleAddr = '0x1111111111111111111111111111111111111111' as Address;
      safeRef.current.enableModule(moduleAddr);
      const result = safeRef.current.execTransactionFromModule({
        module: moduleAddr,
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 0n,
        data: '0x',
      });
      setModuleResult(`module-exec ${result.success ? 'success' : 'fail'} hash=${result.txHash}`);
      setNonce(safeRef.current.getNonce());
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  };

  const handleGuardReject = async () => {
    if (!safeRef.current) return;
    setStatus('pending');
    setError('');
    try {
      safeRef.current.setGuard({
        checkTransaction: () => {
          throw new Error('GUARD_REJECTED');
        },
        checkAfterExecution: () => {},
      });
      const tx = sampleTx()!;
      const sigs = await sortedSigners(tx, [owner1, owner2]);
      await safeRef.current.execTransaction(tx, sigs);
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    } finally {
      safeRef.current.setGuard(null);
    }
  };

  return (
    <main>
      <h1>Safe multi-sig (Level B mock)</h1>

      <p>
        Status:{' '}
        <span
          className={`status status-${
            status === 'success' ? 'ok' : status === 'pending' ? 'pending' : status === 'error' ? 'error' : 'pending'
          }`}
          data-testid="status"
        >
          {status}
        </span>
      </p>

      {safeAddress && (
        <>
          <h2>Safe</h2>
          <code data-testid="safe-address">address: {safeAddress}</code>
          <code data-testid="safe-threshold">threshold: 2</code>
          <code data-testid="safe-nonce">nonce: {nonce?.toString() ?? '?'}</code>
        </>
      )}

      <h2>Actions</h2>
      <div>
        <button data-testid="exec-ok" onClick={handleExecOk}>
          Exec with 2 owner sigs (success)
        </button>
        <button data-testid="exec-below-threshold" onClick={handleExecBelowThreshold}>
          Exec with 1 sig (threshold not met)
        </button>
        <button data-testid="exec-duplicate" onClick={handleExecDuplicate}>
          Exec with duplicate sig
        </button>
        <button data-testid="exec-nonce-reuse" onClick={handleExecNonceReuse}>
          Replay old nonce
        </button>
        <button data-testid="module-exec" onClick={handleModuleOk}>
          Exec via module
        </button>
        <button data-testid="guard-reject" onClick={handleGuardReject}>
          Exec with guard rejecting
        </button>
      </div>

      {txHash && (
        <>
          <h2>Tx hash</h2>
          <code data-testid="tx-hash">{txHash}</code>
        </>
      )}

      {moduleResult && (
        <>
          <h2>Module result</h2>
          <code data-testid="module-result">{moduleResult}</code>
        </>
      )}

      {error && (
        <>
          <h2>Error</h2>
          <code data-testid="error-message">{error}</code>
        </>
      )}
    </main>
  );
}
