import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * example が使うポートが互いに重ならないことを固定する (#1724)。
 *
 * ローカルチェーン (anvil) と web server (Next.js / Vite) の 2 系統を見る。
 *
 * `pnpm test` は example を並列に走らせる。 同じポートを 2 つ以上の example が
 * 使うと、 先に取った 1 つだけが起動し、 残りは `Address already in use` で即座に
 * 落ちる (実測 = 32ms で exit 1)。 どれが先着になるかは実行ごとに変わるため、
 * 落ちる対象が毎回入れ替わる。
 *
 * 実測では 10 の example が `8545` を共有していた。 3 回連続実行で
 * `nextjs-aa-erc4337` / `nextjs-aa-smart-account` / `nextjs-aa-erc4337` と
 * 落ちる対象が入れ替わり、 これが唯一の原因だった。
 *
 * 起動が遅いのではない。 18 個を同時に起動する probe では、 機械が空いている時で
 * 最大 128ms、 全 core を埋めた時でも最大 1,099ms で立った。 待ち時間の既定
 * (10 秒) は 9 倍の余裕がある。
 *
 * web server 側も同じ形で落ちる。 `nextjs-aa-erc4337` と `nextjs-ens-resolver` が
 * どちらも 3042 を使っており、 後から起動した側が
 * `3042 is already used` で落ちた。
 */

// compile 後は `.vitest-dist/tests/` から走るため 4 階層上が repo root。
//
// `import.meta.dirname` は Node 20.11.0 追加で、 repo の下限 (>=20) を下回る
// 20.0-20.10 では undefined になり module 読込時に落ちる。 既存 24 件と同じ形にする。
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
const EXAMPLES_DIR = join(REPO_ROOT, 'examples');

/**
 * example が使うローカルチェーンのポート。
 *
 * 3 つの形を拾う。 起動側だけを見ると、 起動と参照がずれている example を見落とす。
 *
 * - `port: 8545` ... 起動時の指定
 * - `ANVIL_PORT = 8545` ... test / app 側の直接の参照
 * - `process.env.NEXT_PUBLIC_ANVIL_PORT ?? 8545` ... app 側の既定値
 *
 * 3 つ目は env が無い時に実際に使われる値で、 これを見ないと `lib/wagmi.ts` だけ
 * 別のポートに書き換えても検査を通ってしまう。 env 名に `PORT` を含むものに
 * 限るのは、 chain と関係ない待受 (schema registry の 8081 等) を拾わないため。
 */
function collectChainPorts(name: string): Map<number, string[]> {
  const found = new Map<number, string[]>();
  const patterns = [
    /(?:port:\s*|ANVIL_PORT\s*=\s*)(8\d{3})\b/g,
    /process\.env\.[A-Za-z_]*PORT[A-Za-z_]*\s*\?\?\s*(8\d{3})\b/g,
  ];
  for (const file of listSourceFiles(join(EXAMPLES_DIR, name))) {
    const text = readFileSync(file, 'utf8');
    const relative = file.slice(EXAMPLES_DIR.length + name.length + 2);
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const port = Number(match[1]);
        found.set(port, [...(found.get(port) ?? []), relative]);
      }
    }
  }
  return found;
}

/** example 配下の source を辿る。 生成物と依存は降りない。 */
function listSourceFiles(root: string, depth = 0): string[] {
  if (!existsSync(root) || depth > 5) return [];
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'out', 'coverage', '.vitest-dist'].includes(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;
      out.push(...listSourceFiles(join(root, entry.name), depth + 1));
      continue;
    }
    if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(join(root, entry.name));
  }
  return out;
}

/**
 * example が使う web server のポート。
 *
 * `playwright.config.ts` の `url` / `baseURL` と、 `package.json` の
 * `next dev -p` / `next start -p` を拾う。 config だけを見ると、 起動と待受が
 * ずれている example を見落とす。
 */
function collectServerPorts(name: string): Set<number> {
  const found = new Set<number>();
  const config = join(EXAMPLES_DIR, name, 'playwright.config.ts');
  if (existsSync(config)) {
    for (const match of readFileSync(config, 'utf8').matchAll(/127\.0\.0\.1:(\d{4})/g)) {
      found.add(Number(match[1]));
    }
  }
  const manifest = join(EXAMPLES_DIR, name, 'package.json');
  if (existsSync(manifest)) {
    const scripts = (JSON.parse(readFileSync(manifest, 'utf8')) as {
      scripts?: Record<string, string>;
    }).scripts ?? {};
    for (const script of Object.values(scripts)) {
      for (const match of script.matchAll(/(?:next|vite)[^&|]*?-p\s+(\d{4})/g)) {
        found.add(Number(match[1]));
      }
    }
  }
  return found;
}

/** browser を起動する対象か。 */
function usesBrowser(dir: string): boolean {
  for (const sub of ['tests', 'src']) {
    for (const file of listSourceFiles(join(dir, sub))) {
      const text = readFileSync(file, 'utf8');
      if (/setupE2eEnv|setupBrowserComponentEnv|chromium\.launch/.test(text)) return true;
    }
  }
  return false;
}

function readScripts(dir: string): Record<string, string> {
  const manifest = join(dir, 'package.json');
  if (!existsSync(manifest)) return {};
  return (JSON.parse(readFileSync(manifest, 'utf8')) as {
    scripts?: Record<string, string>;
  }).scripts ?? {};
}

const READ_INTO_VAR =
  /(?:const|let)\s+(\w+)\s*=\s*(?:bigintFromText\(\s*)?\(await page\.getByTestId\(\s*['"]([^'"]+)['"]\s*\)\.(?:textContent|innerText)/g;
const OPERATION = /\.(click|fill|press|check|uncheck|selectOption)\(/g;

/**
 * 「操作の後に読む表示を、 その表示自身を待たずに読んでいる」 箇所を spec から拾う。
 *
 * 基準にするのは **その read の直前の操作**。 test 内の最初の操作を基準にすると、
 * `操作 → 待つ → 操作 → 読む` の形で 1 回目の待ちを拾って通ってしまう。
 *
 * 対象にするのは、 読んだ値を `expect` で比較している場合だけ。 `console.log` に
 * 流すだけの warmup は判定に関係しない。
 *
 * 「変わらないこと」 を確かめる形 (同じ表示を操作の前後で読んで `toBe` で等しさを
 * 見る) は対象外。 待つべき変化が定義上存在せず、 有限の待機の後に変わっていない
 * ことを見る以上の判定はできない。 変化を期待する比較 (`not.toBe`) は対象に残す。
 */
export function findUnwaitedReads(source: string): string[] {
  const hits: string[] = [];
  // test 単位に切る。 test をまたぐと warmup の `console.log` を拾う。
  for (const block of source.split(/\n {2}test\(/).slice(1)) {
    const operations = [...block.matchAll(OPERATION)].map((m) => m.index ?? 0);
    if (operations.length === 0) continue;
    const title = block.slice(0, block.indexOf("'", 1) + 1).replace(/^'/, '');
    for (const match of block.matchAll(READ_INTO_VAR)) {
      const [, varName, testId] = match;
      if (!varName || !testId) continue;
      const readAt = match.index ?? 0;
      // 直前の操作。 操作より前に読んでいる (操作前の値の取得) なら対象外。
      const lastOp = operations.filter((at) => at < readAt).pop();
      if (lastOp === undefined) continue;
      const comparedInExpect = new RegExp(
        `expect\\(${varName}\\)|toBe\\(${varName}\\)|toEqual\\(${varName}\\)`,
      ).test(block);
      if (!comparedInExpect) continue;
      // 同じ表示を先に読んで等しさを見ている = 変わらないことの確認。
      const priorVars = [...block.slice(0, readAt).matchAll(READ_INTO_VAR)]
        .filter(([, , priorId]) => priorId === testId)
        .map(([, priorVar]) => priorVar);
      const assertsUnchanged = priorVars.some((priorVar) =>
        new RegExp(
          `expect\\(${varName}\\)\\.(toBe|toEqual)\\(${priorVar}\\)|` +
            `expect\\(${priorVar}\\)\\.(toBe|toEqual)\\(${varName}\\)`,
        ).test(block.slice(readAt)),
      );
      if (assertsUnchanged) continue;
      // 直前の操作と read の間だけを見る。
      const waited = new RegExp(
        `getByTestId\\(\\s*['"]${testId}['"]\\s*\\)\\)\\s*\\.(not\\.)?to(HaveText|ContainText)`,
      ).test(block.slice(lastOp, readAt));
      if (waited) continue;
      hits.push(`${title} — ${testId} を待たずに読む`);
    }
  }
  return hits;
}

/**
 * root の `test` を `&&` 区切りの phase に切り分ける。
 *
 * 直列 phase は `pnpm --workspace-concurrency=1 -F a -F b test` の形。 名前が
 * script のどこかに現れるかだけを見ると、 `--workspace-concurrency=1` を外して
 * 並列に戻す変更を見逃す。 phase 単位で顔ぶれと同時実行数の両方を見る。
 */
function rootTestPhases(): { raw: string; serial: boolean; targets: string[] }[] {
  const script = (JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  }).scripts?.test ?? '';
  return script
    .split('&&')
    .map((raw) => raw.trim())
    .filter((raw) => /\bpnpm\b/.test(raw) && / test\b|test'?$/.test(raw))
    .map((raw) => ({
      raw,
      serial: /--workspace-concurrency=1\b/.test(raw),
      targets: [...raw.matchAll(/-F\s+(\S+)/g)].map((m) => m[1] ?? ''),
    }));
}

/**
 * 与えた顔ぶれが、 1 つの直列 phase に過不足なく入っていることを確かめる。
 *
 * 過不足まで見るのは、 対象を 1 つ落としても「どこかに名前がある」 だけでは
 * 通ってしまうため。 並列 phase からの除外も併せて確認する。
 */
function expectSerialPhase(expected: string[]): void {
  const phases = rootTestPhases();
  const owning = phases.filter((p) => expected.some((name) => p.targets.includes(name)));
  expect(
    owning.length,
    `対象が 1 つの phase にまとまっていない (${owning.length} phase に分散)`,
  ).toBe(1);
  const phase = owning[0]!;
  expect(phase.serial, `--workspace-concurrency=1 が無い: ${phase.raw}`).toBe(true);
  expect([...phase.targets].sort(), '直列 phase の顔ぶれが一致しない').toEqual(
    [...expected].sort(),
  );
  const script = (JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  }).scripts?.test ?? '';
  const notExcluded = expected.filter((name) => !script.includes(`'!${name}'`));
  expect(notExcluded, `並列 phase から除外されていない: ${notExcluded.join(', ')}`).toEqual([]);
}

describe('ローカルチェーンのポートが重ならない (#1724)', () => {
  const owners = new Map<number, string[]>();
  if (existsSync(EXAMPLES_DIR)) {
    for (const entry of readdirSync(EXAMPLES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const port of collectChainPorts(entry.name).keys()) {
        owners.set(port, [...(owners.get(port) ?? []), entry.name]);
      }
    }
  }

  const serverOwners = new Map<number, string[]>();
  if (existsSync(EXAMPLES_DIR)) {
    for (const entry of readdirSync(EXAMPLES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const port of collectServerPorts(entry.name)) {
        serverOwners.set(port, [...(serverOwners.get(port) ?? []), entry.name]);
      }
    }
  }

  it('web server のポートを 2 つ以上の example が使わない', () => {
    const shared = [...serverOwners.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([port, names]) => `${port} (${names.join(', ')})`)
      .sort();
    expect(
      shared,
      '後から起動した側が `is already used` で落ちる。' + ` 該当: ${shared.join(' / ')}`,
    ).toEqual([]);
  });

  it('チェーンのポートを 2 つ以上の example が使わない', () => {
    const shared = [...owners.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([port, names]) => `${port} (${names.join(', ')})`)
      .sort();
    expect(
      shared,
      '並列実行で先着 1 つだけが起動し、 残りは Address already in use で落ちる。' +
        ` 該当: ${shared.join(' / ')}`,
    ).toEqual([]);
  });

  it('browser を起動する対象は hook の待ち時間も指定している', () => {
    // `--testTimeout` は test 本体にしか効かない。 browser の起動と終了は
    // `beforeAll` / `afterEach` で行うため、 hook 側の既定 (10 秒) が効く。
    // 並列実行の負荷では終了だけで 10 秒を超える (#1724 実測 =
    // `full-stack-poc` の `afterEach` が `Hook timed out in 10000ms`)。
    const missing: string[] = [];
    for (const dir of ['packages', 'examples']) {
      const root = join(REPO_ROOT, dir);
      if (!existsSync(root)) continue;
      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (!usesBrowser(join(root, entry.name))) continue;
        const scripts = readScripts(join(root, entry.name));
        for (const [key, script] of Object.entries(scripts)) {
          if (!key.startsWith('test')) continue;
          for (const call of script.match(/vitest run [^&|]*/g) ?? []) {
            if (!call.includes('--hookTimeout')) missing.push(`${entry.name} (${key})`);
          }
        }
      }
    }
    expect(
      [...new Set(missing)].sort(),
      `browser の起動 / 終了が hook の既定 10 秒に収まらない。 該当: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('browser を実起動する対象は直列 phase にいる', () => {
    // browser は機械に 1 つしかない。 並列 phase に残すと、 起動と終了が他の負荷と
    // 重なって hook の待ち時間を超える (#1724 実測 = `full-stack-poc` が 30 秒でも
    // 溢れた)。 待ち時間をさらに延ばすのではなく、 直列にして重ならなくする。
    //
    // 「実起動する」 の判定は import ではなく実測に依る。 browser API に触れる
    // 対象は 27 あるが、 実際に起動するのは環境が揃った一部だけで、 残りは
    // 1 秒台で終わる。 一覧はその実測で決めた。
    expectSerialPhase(['@kiwa-lab/e2e', '@kiwa-lab/ui', 'examples-full-stack-poc']);
  });

  it('container を起動する対象は直列 phase にいる', () => {
    // Docker の常駐も機械に 1 つしかない。 並列 phase に残すと、 起動が他の負荷と
    // 重なって `Port 3306 not bound after 120000ms` で落ちる (#1724 実測 =
    // `@kiwa-lab/orm` の T-ORM-201 が 153 秒かけて失敗する一方、 同じ実行の
    // T-ORM-202 以降は 9-27 秒で立った)。
    //
    // 「起動する」 の判定は import ではなく Docker への ping に依る。 testcontainers
    // を import する対象は 8 あるが、 実際に container を立てるのは ping で
    // 到達を確かめてから起動する対象だけで、 残りは型を参照するか到達不能を
    // 確かめる負の test しか持たない。
    expectSerialPhase([
      '@kiwa-lab/orm',
      'examples-orm-drizzle-mysql-poc',
      'examples-orm-drizzle-postgres-poc',
      'examples-orm-prisma-mysql-poc',
      'examples-orm-prisma-postgres-poc',
    ]);
  });

  it('example の中でポートの指定が食い違わない', () => {
    // 起動時の指定と、 test / app 側の参照が別々の番号になっていると、
    // 起動は成功するのに繋がらない。
    const inconsistent: string[] = [];
    for (const entry of readdirSync(EXAMPLES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const ports = collectChainPorts(entry.name);
      // 複数チェーンを立てる example (`nextjs-multi-chain`) は別扱い。
      if (ports.size > 1 && !entry.name.includes('multi-chain')) {
        const detail = [...ports.entries()]
          .map(([port, files]) => `${port} (${files.join(', ')})`)
          .join(' / ');
        inconsistent.push(`${entry.name}: ${detail}`);
      }
    }
    expect(inconsistent).toEqual([]);
  });

  it('操作の後に読む表示は、その表示自身が動くのを待ってから読む', () => {
    // 画面の値は表示ごとに別々に取得される。 別の表示 (`released` 等) が動いたことや
    // 固定の待機は、 これから読む表示が更新されたことを意味しない。 負荷がかかると
    // 差が開き、 更新前の値を読んで落ちる。
    //
    // 実測 2 件。 `nextjs-vesting` の T-VS-005 は `released` が満額になるのを待って
    // 残高を読み、 1 回目の反映が 2 回目の後に届いて「2 回目で増えた」 と読み違えた
    // (`0n` と `1000e18` を比較)。 `nextjs-staking` の T-ST-005 は tx が載る前に
    // 時間を進め、 早期解除の penalty で残高が 10% 少なくなった。
    //
    // 検出するのは「操作の後に変数へ読み、 その変数を expect で比較しているのに、
    // 読む前にその表示自身を待っていない」 形。 待ち方は `toHaveText` /
    // `not.toHaveText` のいずれでもよい (値が確定する場合と、 動いたことだけを
    // 見る場合がある)。
    //
    // 「変わらないこと」 を確かめる test は対象外にする。 操作の前後で同じ表示を
    // 読んで `toBe` で等しさを見る形がそれで、 待つべき変化が定義上存在しない
    // (`nextjs-vesting` の T-VS-002 = cliff 前の release は no-op)。 有限の待機の後に
    // 変わっていないことを見る以上の判定はできない。 変化を期待する比較
    // (`not.toBe`) は対象に残す。
    const offenders: string[] = [];
    for (const entry of readdirSync(EXAMPLES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const testsDir = join(EXAMPLES_DIR, entry.name, 'tests');
      if (!existsSync(testsDir)) continue;
      for (const file of readdirSync(testsDir)) {
        if (!file.endsWith('.spec.ts')) continue;
        for (const hit of findUnwaitedReads(readFileSync(join(testsDir, file), 'utf8'))) {
          offenders.push(`${entry.name}/${file} ${hit}`);
        }
      }
    }
    expect(
      offenders.sort(),
      `読む表示を待っていない。 該当:\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });
});

describe('待ち不足の検出そのものを固定する (#1724)', () => {
  // 検出は spec を正規表現で走査する。 実 spec が全て通っている状態では、
  // 検出が壊れても素通りするだけで気付けない。 検出すべき形と、 検出しては
  // ならない形を fixture で固定する。
  const wrap = (body: string) => `
  test('T-FIX fixture', async ({ page }) => {
${body}
  });
`;

  it('操作 → 読む (待ちなし) を検出する', () => {
    const hits = findUnwaitedReads(
      wrap(`    await page.getByTestId('go').click();
    const after = (await page.getByTestId('value').textContent()) ?? '';
    expect(after).toBe('1');`),
    );
    expect(hits.length).toBe(1);
  });

  it('操作 → その表示を待つ → 読む は検出しない', () => {
    const hits = findUnwaitedReads(
      wrap(`    await page.getByTestId('go').click();
    await expect(page.getByTestId('value')).not.toHaveText('0');
    const after = (await page.getByTestId('value').textContent()) ?? '';
    expect(after).toBe('1');`),
    );
    expect(hits).toEqual([]);
  });

  it('操作 → 別の表示を待つ → 読む は検出する', () => {
    // 別の表示が動いたことは、 読む表示が更新されたことを意味しない (#1724 実測)。
    const hits = findUnwaitedReads(
      wrap(`    await page.getByTestId('go').click();
    await expect(page.getByTestId('status')).toHaveText('done');
    const after = (await page.getByTestId('value').textContent()) ?? '';
    expect(after).toBe('1');`),
    );
    expect(hits.length).toBe(1);
  });

  it('操作 → 待つ → 操作 → 読む で、2 回目の待ち不足を検出する', () => {
    // 最初の操作を基準にすると、 1 回目の待ちを拾って通ってしまう。
    const hits = findUnwaitedReads(
      wrap(`    await page.getByTestId('go').click();
    await expect(page.getByTestId('value')).not.toHaveText('0');
    await page.getByTestId('go').click();
    const after = (await page.getByTestId('value').textContent()) ?? '';
    expect(after).toBe('2');`),
    );
    expect(hits.length).toBe(1);
  });

  it('変わらないことの確認は検出しない', () => {
    // 待つべき変化が定義上存在しない。
    const hits = findUnwaitedReads(
      wrap(`    const before = (await page.getByTestId('value').textContent()) ?? '';
    await page.getByTestId('go').click();
    const after = (await page.getByTestId('value').textContent()) ?? '';
    expect(after).toBe(before);`),
    );
    expect(hits).toEqual([]);
  });

  it('変化を期待する前後比較は検出する', () => {
    const hits = findUnwaitedReads(
      wrap(`    const before = (await page.getByTestId('value').textContent()) ?? '';
    await page.getByTestId('go').click();
    const after = (await page.getByTestId('value').textContent()) ?? '';
    expect(after).not.toBe(before);`),
    );
    expect(hits.length).toBe(1);
  });

  it('読むだけで比較しない warmup は検出しない', () => {
    const hits = findUnwaitedReads(
      wrap(`    await page.getByTestId('go').click();
    console.log(await page.getByTestId('value').textContent());`),
    );
    expect(hits).toEqual([]);
  });

  it('let と二重引用符と innerText も拾う', () => {
    const hits = findUnwaitedReads(
      wrap(`    await page.getByTestId("go").click();
    let after = (await page.getByTestId("value").innerText()) ?? '';
    expect(after).toBe('1');`),
    );
    expect(hits.length).toBe(1);
  });

  it('click 以外の操作 (fill / press) も操作として数える', () => {
    const hits = findUnwaitedReads(
      wrap(`    await page.getByTestId('input').fill('x');
    const after = (await page.getByTestId('value').textContent()) ?? '';
    expect(after).toBe('x');`),
    );
    expect(hits.length).toBe(1);
  });
});
