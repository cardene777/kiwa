import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, MINT_NFT_ABI } from './wagmi';

export function App() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending: isMinting } = useWriteContract();

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MINT_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MINT_NFT_ABI,
    functionName: 'totalSupply',
  });

  const onMint = () => {
    if (!address) return;
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: MINT_NFT_ABI,
        functionName: 'mint',
        args: [address],
      },
      {
        onSuccess: () => {
          setTimeout(() => {
            void refetchBalance();
            void refetchSupply();
          }, 800);
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
        <h1 style={{ fontSize: 24, margin: 0 }}>dapp-e2e Vite Mint Demo</h1>
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
        <div data-testid="my-balance">
          balance: {balance !== undefined ? String(balance) : '(loading)'}
        </div>
        <div data-testid="total-supply">
          totalSupply: {totalSupply !== undefined ? String(totalSupply) : '(loading)'}
        </div>
        <button
          data-testid="mint-button"
          onClick={onMint}
          disabled={!isConnected || isMinting}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            borderRadius: 8,
            border: 'none',
            background: isConnected ? '#7C3AED' : '#aaa',
            color: 'white',
            cursor: isConnected ? 'pointer' : 'not-allowed',
          }}
        >
          {isMinting ? 'Minting...' : 'Mint NFT'}
        </button>
      </section>
    </main>
  );
}
