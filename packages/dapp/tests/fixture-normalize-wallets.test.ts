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
});
