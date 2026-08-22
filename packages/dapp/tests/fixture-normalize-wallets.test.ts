import { describe, expect, it } from 'vitest';
import { resolveWalletConfigs } from '../src/fixture.js';
import type { Hex, WalletConfig } from '../src/types.js';

const PK: Hex = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ICON = 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E';

const CONFIG: WalletConfig = {
  name: 'MetaMask',
  rdns: 'io.metamask',
  icon: ICON,
  privateKey: PK,
};

describe('resolveWalletConfigs の wallets 正規化', () => {
  it('T-FIX-211 Playwright fixture 由来の [configs, fixtureArg] tuple は先頭要素だけを読む', () => {
    // Playwright は fixture option をこの形で渡してくる。 先頭が配列なので
    // 「先頭が配列なら再帰」 の分岐だけで解決し、 tuple 判定 helper には入らない
    const tuple = [[CONFIG], { browserName: 'chromium' }] as unknown as WalletConfig[];

    const resolved = resolveWalletConfigs(PK, 31337, tuple);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.rdns).toBe('io.metamask');
    expect(resolved[0]?.chainId).toBe(31337);
  });

  it('T-FIX-212 tuple 判定 helper は先頭要素が読むたびに変わる入力でしか到達しない (dead branch 記録)', () => {
    // 「先頭が配列なら再帰」 の分岐が先にある以上、 その後ろの
    // `wallets.length === 2 && Array.isArray(wallets[0]) && isPlaywrightFixtureTuple(...)`
    // は実入力では常に false になる (= 到達不能な残骸)。
    // 到達不能であることを固定するため、 先頭要素を読むたびに別の値を返す配列を作って
    // 「2 回目の読み取りで初めて配列になる」 という現実には起こらない状況だけを再現する。
    const inner = [CONFIG];
    let reads = 0;
    const wallets = [undefined, { browserName: 'chromium' }] as unknown[];
    Object.defineProperty(wallets, '0', {
      configurable: true,
      get() {
        reads += 1;
        // 1 回目 (先頭が配列かの判定) は配列でない値、 2 回目以降は配列
        return reads === 1 ? CONFIG : inner;
      },
    });

    const resolved = resolveWalletConfigs(PK, 31337, wallets as WalletConfig[]);

    // helper が true を返して先頭要素へ再帰した = 3 回目の読み取りが起きている
    expect(reads).toBeGreaterThanOrEqual(3);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.rdns).toBe('io.metamask');
  });
});
