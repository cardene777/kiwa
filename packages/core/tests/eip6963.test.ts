import { createContext, runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { resolveWalletConfigs, validateWalletConfigs } from '../src/fixture.js';
import { createInjectorScript } from '../src/injector-script.js';
import type { Hex, WalletConfig } from '../src/types.js';

const PK1: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const PK2: Hex =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

class MockCustomEvent<TDetail = unknown> {
  readonly type: string;
  readonly detail: TDetail;

  constructor(type: string, init?: { detail?: TDetail }) {
    this.type = type;
    this.detail = init?.detail as TDetail;
  }
}

interface MockEventTarget {
  __announcements: Array<{
    info: { uuid: string; name: string; icon: string; rdns: string };
    provider: { isMetaMask?: boolean };
  }>;
  __dappE2eEip6963Listeners?: Array<(event: MockCustomEvent) => void>;
  addEventListener(type: string, handler: (event: MockCustomEvent) => void): void;
  removeEventListener(type: string, handler: (event: MockCustomEvent) => void): void;
  dispatchEvent(event: MockCustomEvent): boolean;
  crypto: { randomUUID(): string };
}

function createMockWindow() {
  let uuidCounter = 0;
  const listeners = new Map<string, Array<(event: MockCustomEvent) => void>>();
  const windowTarget = {
    __announcements: [] as MockEventTarget['__announcements'],
    crypto: {
      randomUUID() {
        uuidCounter += 1;
        return `uuid-${uuidCounter}`;
      },
    },
    addEventListener(type: string, handler: (event: MockCustomEvent) => void) {
      const list = listeners.get(type) ?? [];
      list.push(handler);
      listeners.set(type, list);
    },
    removeEventListener(type: string, handler: (event: MockCustomEvent) => void) {
      const list = listeners.get(type);
      if (!list) {
        return;
      }
      const index = list.indexOf(handler);
      if (index >= 0) {
        list.splice(index, 1);
      }
    },
    dispatchEvent(event: MockCustomEvent) {
      const list = listeners.get(event.type) ?? [];
      list.slice().forEach((handler) => handler(event));
      return true;
    },
  };

  windowTarget.addEventListener('eip6963:announceProvider', (event) => {
    windowTarget.__announcements.push(event.detail as MockEventTarget['__announcements'][number]);
  });

  return { windowTarget, getUuidCount: () => uuidCounter };
}

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

  it('T-EIP-007 runtime で info/detail が freeze され、各 wallet で個別 UUID が生成される', () => {
    const wallets: WalletConfig[] = [
      { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK1 },
      { name: 'Rabby', rdns: 'io.rabby', icon: 'data:,', privateKey: PK2 },
    ];
    const script = createInjectorScript({ privateKey: PK1, chainId: 31337, wallets });
    const { windowTarget, getUuidCount } = createMockWindow();
    const context = createContext({
      window: windowTarget,
      crypto: windowTarget.crypto,
      CustomEvent: MockCustomEvent,
    });

    runInContext(script, context);

    const announcements = windowTarget.__announcements;
    expect(announcements).toHaveLength(2);
    expect(getUuidCount()).toBe(2);
    expect(new Set(announcements.map((announcement) => announcement.info.uuid)).size).toBe(2);
    expect(runInContext('Object.isFrozen(window.__announcements[0].info)', context)).toBe(true);
    expect(runInContext('Object.isFrozen(window.__announcements[0])', context)).toBe(true);
  });
});

describe('validateWalletConfigs', () => {
  it('T-EIP-008 invalid chainId (string) で throw する', () => {
    expect(() =>
      validateWalletConfigs([
        {
          name: 'MetaMask',
          rdns: 'io.metamask',
          icon: 'data:,',
          privateKey: PK1,
          chainId: '1' as never,
        },
      ]),
    ).toThrow(/chainId.*positive integer/);
  });

  it('T-EIP-009 invalid privateKey (short hex) で throw する', () => {
    expect(() =>
      validateWalletConfigs([
        {
          name: 'MetaMask',
          rdns: 'io.metamask',
          icon: 'data:,',
          privateKey: '0x1' as never,
        },
      ]),
    ).toThrow(/privateKey.*64-char/);
  });

  it('T-EIP-010 default 経路 (wallets 未指定) でも top-level invalid chainId は throw する', () => {
    expect(() =>
      resolveWalletConfigs(PK1, 'invalid' as unknown as number, undefined),
    ).toThrow(/chainId.*positive integer/);
  });

  it('T-EIP-011 multi-wallet 経路で wallet.chainId 未指定 + top-level invalid chainId が throw する', () => {
    const wallets: WalletConfig[] = [
      { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK1 },
    ];

    expect(() => resolveWalletConfigs(PK1, -1, wallets)).toThrow(/chainId.*positive integer/);
  });
});
