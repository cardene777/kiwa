import { describe, expect, it } from 'vitest';

import { read, skillBody } from './skill-md.js';

/**
 * orchestrator が module に example 名を渡していないか (#2074).
 *
 * repo の宣言は module と example を分けている。 roster の 20 entry のうち 18 で違う値を
 * 持ち、 一致するのは chain が spec も test も生成する dApp 系 2 例だけ。
 *
 * example 名を module として渡すと `kiwa layers` は存在しない path を返す (実測で spec が
 * `test-spec-nextjs-app-router-full.nextjs.md`、 `test_paths.files` が空)。 `/kiwa-observe` は
 * `test_paths.files` が空なら中断するため、 Step 5a が全 layer で止まる。
 */

const TEST = skillBody('kiwa-test');
const ROSTER = read('tests/release-smoke/tests/layer-test-output-resolves.test.ts');

/** roster が宣言する (layer, module, example) の組。 */
const ENTRIES = [
  ...ROSTER.matchAll(
    /layer:\s*'([a-z0-9-]+)'[\s\S]{0,160}?module:\s*'([a-z0-9-]+)'[\s\S]{0,120}?example:\s*'([a-z0-9-]+)'/g,
  ),
].map((m) => ({ layer: m[1]!, module: m[2]!, example: m[3]! }));

describe('module と example は別の値である', () => {
  it('roster を読めている (空振り防止)', () => {
    // 正規表現が roster の一部に追随できなくなっても、 1 件以上だけでは
    // 残った entry だけを見て緑になる。 本文が宣言する 20 件全てを固定する。
    expect(ENTRIES).toHaveLength(20);
  });

  it('大半の layer で module と example が違う', () => {
    // 「別物である」 という前提そのものを実物で固定する。 全件一致するようになったら
    // `--module` を分ける理由が消えるので、 その時はこの検査が落ちて気付ける。
    const differ = ENTRIES.filter((e) => e.module !== e.example);
    expect(differ, 'module と example の不一致数が本文と違う').toHaveLength(18);
  });
});

describe('kiwa-test が module を example から分けて渡す', () => {
  it('--module option を宣言している', () => {
    expect(TEST, '--module の宣言が無い').toMatch(/^- `--module \{name\}`/m);
  });

  it('既定が --example の値であることを書いている', () => {
    // 既定を変えると dApp 系 2 例の既存 chain が壊れる。 既定そのものを固定する。
    const line = TEST.split('\n').find((l) => l.startsWith('- `--module {name}`'));
    expect(line, '--module の宣言行が無い').toBeTruthy();
    expect(line!, '既定が --example であることが書かれていない').toContain('`--example` の値');
  });

  it('手順に `--module {example}` の形が 1 件も無い', () => {
    // 19 箇所あった。 1 箇所でも残ると、 その step だけ別 module を見る。
    const stray = TEST.split('\n')
      .map((line, i) => ({ line, no: i + 1 }))
      .filter((l) => l.line.includes('--module {example}'));
    expect(stray.map((s) => `${s.no}: ${s.line.trim().slice(0, 60)}`)).toEqual([]);
  });

  it('`kiwa layers` に渡す module が $MODULE である', () => {
    // shell block 側。 `$EXAMPLE` のままだと解決先が example 名になる。
    expect(TEST, '`--module "$EXAMPLE"` が残っている').not.toContain('--module "$EXAMPLE"');
    const calls = [...TEST.matchAll(/kiwa layers[^\n]*--module "(\$[A-Z_]+)"/g)].map((m) => m[1]!);
    expect(calls.length, '`kiwa layers --module` の呼出が無い (検査が空振りしている)').toBeGreaterThan(0);
    expect([...new Set(calls)], 'module に別の変数を渡している呼出がある').toEqual(['$MODULE']);
  });

  it('module が必須の Layer 2 skill に同じ値を渡す', () => {
    for (const skill of ['kiwa-play', 'kiwa-e2e', 'kiwa-a11y']) {
      const invocation = TEST.split('\n').find((line) => line.includes(`/${skill} --`));
      expect(invocation, `/${skill} の呼出が無い`).toBeTruthy();
      expect(invocation, `/${skill} に module を渡していない`).toContain('--module {module}');
    }
  });

  it('module で決まる生成物 path に example placeholder を使わない', () => {
    expect(TEST, 'spec path がexample 名のまま').not.toMatch(/test-spec-\{example\}/);
    expect(TEST, 'coverage report path がexample 名のまま').not.toContain(
      'coverage-report-{example}',
    );
    expect(TEST, 'result-review path がexample 名のまま').not.toContain(
      'result-review-{example}',
    );
  });

  it('$MODULE の意味を書いている', () => {
    expect(TEST, '$MODULE の説明が無い').toMatch(/\$MODULE` は skill 引数の `--module`/);
  });
});

describe('writer 側の生成 file 名が module 基準である', () => {
  // orchestrator が `--module` を渡しても、 writer が example 名で書けば
  // `kiwa layers` 経由で引き当てられない。 呼出側と writer の両方を固定する。
  it.each([
    ['kiwa-play', /tests\/\{module\}\.spec\.ts/],
    ['kiwa-e2e', /\{module\}\.spec\.ts/],
    ['kiwa-a11y', /\{module\}\.(?:test\.tsx|spec\.ts)/],
  ])('%s が生成 file 名に module を使う', (skill, pattern) => {
    const body = skillBody(skill);
    expect(body, `${skill}: 生成 file 名が module 基準でない`).toMatch(pattern);
  });

  it('生成 file 名に example placeholder を使う skill が無い', () => {
    // 逆向き。 `{example}.spec.ts` 等が 1 件でも残ると、 その skill だけ別名で書く。
    const offenders: string[] = [];
    for (const skill of ['kiwa-play', 'kiwa-e2e', 'kiwa-a11y']) {
      const hits = [...skillBody(skill).matchAll(/\{example\}\.(?:spec|test|e2e|a11y)/g)];
      if (hits.length) offenders.push(`${skill}: ${hits.length} 件`);
    }
    expect(offenders, '生成 file 名が example 名のままの skill がある').toEqual([]);
  });
});

describe('example path 側は example 名のままである', () => {
  it('dir を指す箇所が $MODULE に置き換わっていない', () => {
    // `examples/$EXAMPLE/` は実 dir なので module にしてはいけない。 置換の巻き添えを防ぐ。
    expect(TEST, 'example dir が $MODULE になっている').not.toContain('examples/$MODULE');
    expect(TEST, 'fixtures 先が $MODULE になっている').not.toContain('tests/fixtures/$MODULE');
    // 実 dir を指す行が残っていること自体も確かめる (全部消えていたら置換が行き過ぎている)。
    expect(TEST, 'example dir を指す行が消えている').toContain('examples/$EXAMPLE');
  });
});
