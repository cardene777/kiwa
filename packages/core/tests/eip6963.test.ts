import { describe, expect, it } from 'vitest';
import { createInjectorScript } from '../src/injector-script.js';
import type { Hex, WalletConfig } from '../src/types.js';

const PK1: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const PK2: Hex =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

describe('createInjectorScript EIP-6963', () => {
  it('T-EIP-001 default 単一 wallet で window.ethereum inject script が生成される', () => {
    const script = createInjectorScript({ privateKey: PK1, chainId: 31337 });

    expect(script).toContain('window.ethereum');
    expect(script).toContain('eip6963:announceProvider');
    expect(script).toContain('eip6963:requestProvider');
    expect(script).toContain('Object.freeze');
    expect(script).toContain('crypto.randomUUID');
  });

  it('T-EIP-002 wallets 2 件指定で 2 つの provider announce script が生成される', () => {
    const wallets: WalletConfig[] = [
      { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK1 },
      { name: 'Rabby', rdns: 'io.rabby', icon: 'data:,', privateKey: PK2 },
    ];

    const script = createInjectorScript({ privateKey: PK1, chainId: 31337, wallets });

    expect(script).toContain('MetaMask');
    expect(script).toContain('Rabby');
    expect(script).toContain('io.metamask');
    expect(script).toContain('io.rabby');
    expect(script).toContain('__dappE2eRpc_io_metamask');
    expect(script).toContain('__dappE2eRpc_io_rabby');
    const windowEthMatches = script.match(/window\.ethereum\s*=/g) || [];
    expect(windowEthMatches.length).toBe(1);
  });

  it('T-EIP-003 生成 script に Object.freeze が含まれる (immutable info の仕様要件)', () => {
    const wallets: WalletConfig[] = [
      { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK1 },
    ];

    const script = createInjectorScript({ privateKey: PK1, chainId: 31337, wallets });
    const freezeMatches = script.match(/Object\.freeze\s*\(/g) || [];

    expect(freezeMatches.length).toBeGreaterThanOrEqual(2);
  });

  it('T-EIP-004 生成 script に eip6963:requestProvider listener 登録が含まれる', () => {
    const wallets: WalletConfig[] = [
      { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK1 },
      { name: 'Rabby', rdns: 'io.rabby', icon: 'data:,', privateKey: PK2 },
    ];

    const script = createInjectorScript({ privateKey: PK1, chainId: 31337, wallets });

    expect(script).toContain("'eip6963:requestProvider'");
  });

  it('T-EIP-005 window.ethereum は最初の wallet のみで legacy 互換', () => {
    const wallets: WalletConfig[] = [
      { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK1 },
      { name: 'Rabby', rdns: 'io.rabby', icon: 'data:,', privateKey: PK2 },
    ];

    const script = createInjectorScript({ privateKey: PK1, chainId: 31337, wallets });
    const windowEthMatches = script.match(/window\.ethereum\s*=/g) || [];

    expect(windowEthMatches.length).toBe(1);
    expect(script).toContain('__dappE2eRpc_io_metamask');
  });

  it('T-EIP-006 sanitize logic で rdns の特殊文字が `_` に置換される', () => {
    const wallets: WalletConfig[] = [
      {
        name: 'Coinbase',
        rdns: 'com.coinbase.wallet',
        icon: 'data:,',
        privateKey: PK1,
      },
    ];

    const script = createInjectorScript({ privateKey: PK1, chainId: 31337, wallets });

    expect(script).toContain('__dappE2eRpc_com_coinbase_wallet');
  });
});
