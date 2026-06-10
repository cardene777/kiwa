'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MockSignClient,
  MockWallet,
  type WcSession,
} from '@/lib/wc-mock-client';

type Status = 'disconnected' | 'pairing' | 'connected' | 'rejected';

export default function Home() {
  const [status, setStatus] = useState<Status>('disconnected');
  const [uri, setUri] = useState<string>('');
  const [session, setSession] = useState<WcSession | null>(null);
  const [signature, setSignature] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const clientRef = useRef<MockSignClient | null>(null);
  const walletRef = useRef<MockWallet | null>(null);

  useEffect(() => {
    clientRef.current = new MockSignClient({
      metadata: {
        name: 'kiwa example dApp',
        description: 'WalletConnect v2 Level B mock example',
        url: 'http://localhost:3045',
      },
    });
    walletRef.current = new MockWallet({
      accounts: ['eip155:31337:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      chainId: 31337,
      metadata: {
        name: 'kiwa mock wallet',
        description: 'In-memory WalletConnect wallet',
        url: 'http://localhost:3045',
      },
    });
  }, []);

  const handleConnect = async () => {
    if (!clientRef.current || !walletRef.current) return;
    setError('');
    setStatus('pairing');

    const { uri: pairingUri, approval } = clientRef.current.pair({ approvalTimeoutMs: 5_000 });
    setUri(pairingUri);
    walletRef.current.pair(pairingUri);

    try {
      const newSession = await approval;
      setSession(newSession);
      setStatus('connected');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('rejected');
    }
  };

  const handleTimeout = async () => {
    if (!clientRef.current) return;
    setError('');
    setStatus('pairing');

    const { uri: pairingUri, approval } = clientRef.current.pair({ approvalTimeoutMs: 500 });
    setUri(pairingUri);
    // intentionally do not call wallet.pair() so the proposal expires

    try {
      await approval;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('rejected');
    }
  };

  const handleSign = async () => {
    if (!clientRef.current || !session) return;
    const result = await clientRef.current.request<string>({
      topic: session.topic,
      chainId: `eip155:${session.chainId}`,
      request: { method: 'personal_sign', params: ['Hello kiwa'] },
    });
    setSignature(result);
  };

  const handleSendTx = async () => {
    if (!clientRef.current || !session) return;
    const result = await clientRef.current.request<string>({
      topic: session.topic,
      chainId: `eip155:${session.chainId}`,
      request: {
        method: 'eth_sendTransaction',
        params: [
          {
            to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            value: '0x0',
          },
        ],
      },
    });
    setTxHash(result);
  };

  const handleDisconnect = async () => {
    if (!clientRef.current || !session) return;
    await clientRef.current.disconnect(session.topic);
    setSession(null);
    setUri('');
    setSignature('');
    setTxHash('');
    setStatus('disconnected');
  };

  return (
    <main>
      <h1>WalletConnect v2 (Level B mock)</h1>

      <p>
        Status:{' '}
        <span className={`status status-${status === 'connected' ? 'connected' : status === 'pairing' ? 'pairing' : 'disconnected'}`} data-testid="status">
          {status}
        </span>
      </p>

      <div>
        <button data-testid="connect-button" onClick={handleConnect} disabled={status === 'connected'}>
          Connect (auto-approve)
        </button>
        <button data-testid="timeout-button" onClick={handleTimeout} disabled={status === 'connected'}>
          Trigger timeout
        </button>
        <button data-testid="sign-button" onClick={handleSign} disabled={status !== 'connected'}>
          personal_sign
        </button>
        <button data-testid="send-tx-button" onClick={handleSendTx} disabled={status !== 'connected'}>
          eth_sendTransaction
        </button>
        <button data-testid="disconnect-button" onClick={handleDisconnect} disabled={status !== 'connected'}>
          Disconnect
        </button>
      </div>

      {uri && (
        <>
          <h2>Pairing URI</h2>
          <code data-testid="uri">{uri}</code>
        </>
      )}

      {session && (
        <>
          <h2>Session</h2>
          <code data-testid="session-topic">topic: {session.topic}</code>
          <code data-testid="session-account">account: {session.accounts[0]}</code>
          <code data-testid="session-chain">chainId: {session.chainId}</code>
        </>
      )}

      {signature && (
        <>
          <h2>Signature</h2>
          <code data-testid="signature">{signature}</code>
        </>
      )}

      {txHash && (
        <>
          <h2>Tx hash</h2>
          <code data-testid="tx-hash">{txHash}</code>
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
