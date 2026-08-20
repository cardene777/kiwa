import { afterEach, describe, expect, it } from 'vitest';
import { setupComponentEnv, type UiTestEnv } from '@kiwa-lab/ui';
import { Counter } from '../src/counter.js';

const envs: UiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('Counter (render mode)', () => {
  it('T-UI-001 初期 render: initial=3 で value が "3"', async () => {
    const env = await setupComponentEnv({ mode: 'render', ui: <Counter initial={3} /> });
    envs.push(env);
    if (env.kind !== 'render') throw new Error('expected render');
    expect(env.screen.getByTestId('value').textContent).toBe('3');
  });

  it('T-UI-002 step 反映: initial=0 step=5 で value が "0"', async () => {
    const env = await setupComponentEnv({
      mode: 'render',
      ui: <Counter initial={0} step={5} />,
    });
    envs.push(env);
    if (env.kind !== 'render') throw new Error('expected render');
    expect(env.screen.getByTestId('value').textContent).toBe('0');
  });
});

describe('Counter (interaction mode)', () => {
  it('T-UI-003 + クリックで value が "1"', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    await env.user.click(env.screen.getByRole('button', { name: 'increment' }));
    expect(env.screen.getByTestId('value').textContent).toBe('1');
  });

  it('T-UI-004 連続クリック × 3 で value が "3"', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    const incBtn = env.screen.getByRole('button', { name: 'increment' });
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    expect(env.screen.getByTestId('value').textContent).toBe('3');
  });

  // T-UI-008 (reset の戻り先) を同時に覆う。
  // spec の T-UI-008 は「`initial=5` で `+` を 3 回 → `reset` → value が `"5"`」 で、
  // 本 test の手順と assertion がそのまま一致する。
  it('T-UI-005 / T-UI-008 reset で initial に戻る', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter initial={5} /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    const incBtn = env.screen.getByRole('button', { name: 'increment' });
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    expect(env.screen.getByTestId('value').textContent).toBe('8');
    await env.user.click(env.screen.getByRole('button', { name: 'reset' }));
    expect(env.screen.getByTestId('value').textContent).toBe('5');
  });

  // T-UI-009 (max 到達で無効化) と T-UI-010 (max 到達で status 表示) を同時に覆う。
  // 2 つの assertion がそれぞれ 1 項目に対応する = `incBtn.disabled` が T-UI-009、
  // `getByRole('status')` が T-UI-010。
  it('T-UI-006 / T-UI-009 / T-UI-010 max 到達で + ボタンが disabled になり status が表示される', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter initial={0} max={2} /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    const incBtn = env.screen.getByRole('button', { name: 'increment' }) as HTMLButtonElement;
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    expect(incBtn.disabled).toBe(true);
    expect(env.screen.getByRole('status').textContent).toBe('max reached');
  });
});

describe('Counter (snapshot mode)', () => {
  // T-UI-012 (markup の値) と T-UI-013 (markup のボタン) を同時に覆う。
  // 前 2 つの assertion (`data-testid="value"` / `>7<`) が T-UI-012、
  // 後 2 つ (`aria-label="increment"` / `"reset"`) が T-UI-013 に対応する。
  it('T-UI-007 / T-UI-012 / T-UI-013 markup に value + ボタン群が含まれる', async () => {
    const env = await setupComponentEnv({ mode: 'snapshot', ui: <Counter initial={7} /> });
    envs.push(env);
    if (env.kind !== 'snapshot') throw new Error('expected snapshot');
    expect(env.markup).toContain('data-testid="value"');
    expect(env.markup).toContain('>7<');
    expect(env.markup).toContain('aria-label="increment"');
    expect(env.markup).toContain('aria-label="reset"');
  });
});

// ---- ここから下は `/kiwa-design --layer ui --module counter` が未覆と判定した 5 件
// (T-UI-003 / 004 / 007 / 011 / 014)。
// spec = tests/spec/integration/test-spec-counter.ui.ja.md
//
// 既存 7 件が spec の 9 TC (T-UI-001 / 002 / 005 / 006 / 008 / 009 / 010 / 012 / 013) を覆う。
// 3 件が複数 TC を確かめているため数が合わない。
//
// **覆っている TC の番号は全て test 名に書く** (#2094)。 以前は「中身を読んで重複と
// 判断したので書いていない」 としていたが、 `analyzeSpecCoverage` は spec の TC ID が
// test code に literal で現れるかだけを見るため、 書かないと覆っていても未実装と
// 報告される。 実測で 5 件が偽陽性になった (#2093 の dashboard)。
//
// 番号は意味的な等価判定の代わりに置かれた契約なので、 覆ったなら書く。 逆に覆って
// いない番号を書くと偽の「覆った」 を作るため、 書く前に assertion と spec の確認内容を
// 突き合わせる。
//
// module 直下の `envs` と `afterEach` はそのまま使う
// (`existing-test-reuse.md` § 3 = 既存の後始末は変えない)。

describe('Counter (未覆分の追記: prop の組合せと無効化の解除)', () => {
  it('T-UI-003 max 未到達では status が出ない', async () => {
    const env = await setupComponentEnv({ mode: 'render', ui: <Counter initial={0} max={2} /> });
    envs.push(env);
    if (env.kind !== 'render') throw new Error('expected render');
    expect(env.screen.queryByRole('status')).toBeNull();
  });

  it('T-UI-004 initial が max 以上なら最初から + が disabled', async () => {
    const env = await setupComponentEnv({ mode: 'render', ui: <Counter initial={2} max={2} /> });
    envs.push(env);
    if (env.kind !== 'render') throw new Error('expected render');
    const incBtn = env.screen.getByRole('button', { name: 'increment' }) as HTMLButtonElement;
    expect(incBtn.disabled).toBe(true);
  });

  // 既存 `T-UI-002` は名前が「step 反映」 だが assertion は mount 直後の value だけで、
  // `+` を 1 度も click していない。 step が加算に効いているかはここで初めて確かめる。
  it('T-UI-007 step=5 で + を 1 回押すと 5 増える', async () => {
    const env = await setupComponentEnv({
      mode: 'interaction',
      ui: <Counter initial={0} step={5} />,
    });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    await env.user.click(env.screen.getByRole('button', { name: 'increment' }));
    expect(env.screen.getByTestId('value').textContent).toBe('5');
  });

  it('T-UI-011 max 到達後に reset すると + が再び有効になる', async () => {
    const env = await setupComponentEnv({ mode: 'interaction', ui: <Counter initial={0} max={2} /> });
    envs.push(env);
    if (env.kind !== 'interaction') throw new Error('expected interaction');
    const incBtn = env.screen.getByRole('button', { name: 'increment' }) as HTMLButtonElement;
    await env.user.click(incBtn);
    await env.user.click(incBtn);
    expect(incBtn.disabled).toBe(true);
    await env.user.click(env.screen.getByRole('button', { name: 'reset' }));
    const afterReset = env.screen.getByRole('button', { name: 'increment' }) as HTMLButtonElement;
    expect(afterReset.disabled).toBe(false);
  });

  it('T-UI-014 max 到達時の markup に status が含まれる', async () => {
    const env = await setupComponentEnv({ mode: 'snapshot', ui: <Counter initial={2} max={2} /> });
    envs.push(env);
    if (env.kind !== 'snapshot') throw new Error('expected snapshot');
    expect(env.markup).toContain('role="status"');
  });
});
