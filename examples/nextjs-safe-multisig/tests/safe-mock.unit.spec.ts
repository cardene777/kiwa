import { test, expect } from '@playwright/test';
import { privateKeyToAccount } from 'viem/accounts';
import { SafeProxyFactory } from '../lib/safe-mock';

/**
 * `safe-mock` の hash 計算そのものを browser を介さずに固定する。
 *
 * 画面経由の spec (`safe.spec.ts`) は「描画された結果」 を見るため、 計算の性質
 * (決定性 / owners 順序の反映 / アドレスの詰め方) を個別に落とせない。 #1742 では
 * アドレスを文字列として hex 化していた不具合が、 画面が落ちるまで誰にも
 * 検知されなかった。 計算に直接当てる層をここに置く。
 */

const OWNER_1_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const OWNER_2_PK = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const OWNER_3_PK = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const CHAIN_ID = 31337;
const SALT = 1n;
const THRESHOLD = 2;

const owners = [
  privateKeyToAccount(OWNER_1_PK).address,
  privateKeyToAccount(OWNER_2_PK).address,
  privateKeyToAccount(OWNER_3_PK).address,
].sort();

/** app (`app/page.tsx`) と同じ引数で作る。 期待値はこの手順から算出した固定値。 */
const factory = () => new SafeProxyFactory(CHAIN_ID);

const EXPECTED_SAFE_ADDRESS = '0x5434c0b8a2cbb17b98e7a76b07b02d0a5b199768';
const EXPECTED_TX_HASH = '0xda76ea7bea859e2cd200506bc81b4269119458305fc29d2d7c7e120741c6d31a';

test.describe('safe-mock の hash 計算', () => {
  test('computeAddress が固定値を返す (アドレスを byte 列として 32 byte に詰める)', () => {
    // 文字列として hex 化すると 42 byte になり例外で落ちる (#1742)。
    // 値で固定しておけば、 詰め方を変えた時にここが落ちる。
    expect(factory().computeAddress(owners, THRESHOLD, SALT)).toBe(EXPECTED_SAFE_ADDRESS);
  });

  test('computeAddress は同じ入力に対して決定的', () => {
    expect(factory().computeAddress(owners, THRESHOLD, SALT)).toBe(
      factory().computeAddress(owners, THRESHOLD, SALT),
    );
  });

  test('owners の順序が結果に効く (Safe の sorted-signers 前提)', () => {
    // 順序を無視する実装に変わっても画面経由では気付けない。
    expect(factory().computeAddress([...owners].reverse(), THRESHOLD, SALT)).not.toBe(
      EXPECTED_SAFE_ADDRESS,
    );
  });

  test('threshold と salt も結果に効く', () => {
    expect(factory().computeAddress(owners, 3, SALT)).not.toBe(EXPECTED_SAFE_ADDRESS);
    expect(factory().computeAddress(owners, THRESHOLD, 2n)).not.toBe(EXPECTED_SAFE_ADDRESS);
  });

  test('hashTransaction が固定値を返す', () => {
    const safe = factory().deploy(owners, THRESHOLD, SALT);
    const tx = safe.propose({
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      value: 0n,
      data: '0x',
    });
    // `tx.to` / `gasToken` / `refundReceiver` と domain の `this.address` も
    // アドレスなので、 いずれかの詰め方が変わればこの値が変わる。
    expect(safe.hashTransaction(tx)).toBe(EXPECTED_TX_HASH);
  });

  test('chainId が domain separator に効く', () => {
    const other = new SafeProxyFactory(1).deploy(owners, THRESHOLD, SALT);
    const safe = factory().deploy(owners, THRESHOLD, SALT);
    const args = {
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const,
      value: 0n,
      data: '0x' as const,
    };
    expect(other.hashTransaction(other.propose(args))).not.toBe(
      safe.hashTransaction(safe.propose(args)),
    );
  });
});
