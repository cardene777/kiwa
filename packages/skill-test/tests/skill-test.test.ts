import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCalledWith,
  assertToolCallOrder,
  assertToolNotCalled,
  createToolSpy,
} from '../src/index.js';

describe('createToolSpy', () => {
  it('record + getCalls で挿入順を保持する', () => {
    const spy = createToolSpy();
    spy.record('Read', '{"file":"a.md"}');
    spy.record('Bash', '{"cmd":"ls"}');
    const calls = spy.getCalls();
    expect(calls).toHaveLength(2);
    expect(calls[0]?.name).toBe('Read');
    expect(calls[1]?.name).toBe('Bash');
    expect(calls[0]?.order).toBe(0);
    expect(calls[1]?.order).toBe(1);
  });

  it('getCallsFor で tool 名 filter', () => {
    const spy = createToolSpy();
    spy.record('Read', '{}');
    spy.record('Bash', '{}');
    spy.record('Read', '{}');
    expect(spy.getCallsFor('Read')).toHaveLength(2);
    expect(spy.getCallsFor('Bash')).toHaveLength(1);
    expect(spy.getCallsFor('Missing')).toHaveLength(0);
  });

  it('reset で counter が 0 に戻る', () => {
    const spy = createToolSpy();
    spy.record('X', '{}');
    spy.reset();
    expect(spy.getCalls()).toHaveLength(0);
    spy.record('Y', '{}');
    expect(spy.getCalls()[0]?.order).toBe(0);
  });

  it('getCalls は defensive copy を返す (外部変更が spy 内部に影響しない)', () => {
    const spy = createToolSpy();
    spy.record('A', '{}');
    const first = spy.getCalls();
    first.push({ name: 'FAKE', arguments: '{}', order: 999 });
    expect(spy.getCalls()).toHaveLength(1);
  });
});

describe('assertToolCalled', () => {
  it('少なくとも 1 回呼ばれていれば pass', () => {
    const spy = createToolSpy();
    spy.record('Read', '{}');
    expect(() => assertToolCalled(spy, 'Read')).not.toThrow();
  });

  it('未呼出で throw', () => {
    const spy = createToolSpy();
    spy.record('Bash', '{}');
    expect(() => assertToolCalled(spy, 'Read')).toThrow(/never invoked/);
  });

  it('times 指定で回数厳密一致', () => {
    const spy = createToolSpy();
    spy.record('X', '{}');
    spy.record('X', '{}');
    expect(() => assertToolCalled(spy, 'X', { times: 2 })).not.toThrow();
    expect(() => assertToolCalled(spy, 'X', { times: 3 })).toThrow(/expected tool "X" to be called 3 time/);
  });
});

describe('assertToolNotCalled', () => {
  it('未呼出で pass', () => {
    const spy = createToolSpy();
    spy.record('Bash', '{}');
    expect(() => assertToolNotCalled(spy, 'Read')).not.toThrow();
  });

  it('1 回でも呼ばれてたら throw', () => {
    const spy = createToolSpy();
    spy.record('Read', '{}');
    expect(() => assertToolNotCalled(spy, 'Read')).toThrow(/expected tool "Read" to be never called/);
  });
});

describe('assertToolCalledWith', () => {
  it('引数一致 (deep equal) で pass', () => {
    const spy = createToolSpy();
    spy.record('Read', '{"file":"a.md","start":0}');
    expect(() =>
      assertToolCalledWith(spy, 'Read', { file: 'a.md', start: 0 }),
    ).not.toThrow();
  });

  it('引数不一致で throw', () => {
    const spy = createToolSpy();
    spy.record('Read', '{"file":"a.md"}');
    expect(() =>
      assertToolCalledWith(spy, 'Read', { file: 'b.md' }),
    ).toThrow(/no call matched expected args/);
  });

  it('複数呼出のうち 1 つでも一致すれば pass', () => {
    const spy = createToolSpy();
    spy.record('Bash', '{"cmd":"ls"}');
    spy.record('Bash', '{"cmd":"pwd"}');
    spy.record('Bash', '{"cmd":"echo"}');
    expect(() => assertToolCalledWith(spy, 'Bash', { cmd: 'pwd' })).not.toThrow();
  });

  it('tool 未呼出で throw', () => {
    const spy = createToolSpy();
    expect(() =>
      assertToolCalledWith(spy, 'Missing', { arg: 'x' }),
    ).toThrow(/was never called/);
  });

  it('non-JSON 引数 (CLI style) は raw string 比較 fallback', () => {
    const spy = createToolSpy();
    spy.record('cli-cmd', 'flag1 --opt val');
    expect(() =>
      assertToolCalledWith(spy, 'cli-cmd', 'flag1 --opt val'),
    ).not.toThrow();
  });
});

describe('assertToolCallOrder', () => {
  it('subsequence として一致すれば pass', () => {
    const spy = createToolSpy();
    spy.record('Read', '{}');
    spy.record('Bash', '{}');
    spy.record('Write', '{}');
    expect(() => assertToolCallOrder(spy, ['Read', 'Bash', 'Write'])).not.toThrow();
  });

  it('間に他 tool 挟んでも subsequence 一致で pass', () => {
    const spy = createToolSpy();
    spy.record('Read', '{}');
    spy.record('Grep', '{}');
    spy.record('Bash', '{}');
    spy.record('Extra', '{}');
    spy.record('Write', '{}');
    expect(() => assertToolCallOrder(spy, ['Read', 'Bash', 'Write'])).not.toThrow();
  });

  it('順序逆で throw', () => {
    const spy = createToolSpy();
    spy.record('Bash', '{}');
    spy.record('Read', '{}');
    expect(() =>
      assertToolCallOrder(spy, ['Read', 'Bash']),
    ).toThrow(/matched up to index/);
  });

  it('欠落 tool があれば throw', () => {
    const spy = createToolSpy();
    spy.record('Read', '{}');
    spy.record('Bash', '{}');
    expect(() =>
      assertToolCallOrder(spy, ['Read', 'Missing', 'Bash']),
    ).toThrow(/matched up to index/);
  });

  it('TC-016 spy が空で expectedOrder も空なら pass', () => {
    const spy = createToolSpy();
    expect(() => assertToolCallOrder(spy, [])).not.toThrow();
  });

  it('TC-017 呼出記録があっても expectedOrder が空なら pass', () => {
    const spy = createToolSpy();
    spy.record('Read', '{}');
    expect(() => assertToolCallOrder(spy, [])).not.toThrow();
  });
});

// `/kiwa-design --layer unit --module dogfood-probe` が起こした TC のうち、
// 既存 19 件が覆っていなかった 7 件 (spec の TC-014 / 015 / 017 / 018 / 021 / 022 / 023)。
// spec = tests/spec/unit/test-spec-dogfood-probe.ja.md
describe('assertToolCalled — times: 0 の境界', () => {
  it('TC-014 未呼出で times: 0 なら pass', () => {
    const spy = createToolSpy();
    expect(() => assertToolCalled(spy, 'Read', { times: 0 })).not.toThrow();
  });

  it('TC-015 1 回呼ばれていて times: 0 なら throw', () => {
    const spy = createToolSpy();
    spy.record('Read', '{}');
    expect(() => assertToolCalled(spy, 'Read', { times: 0 })).toThrow(
      /expected tool "Read" to be called 0 time\(s\), observed 1/,
    );
  });
});

describe('assertToolCalledWith — deepEquals の分岐', () => {
  it('TC-021 入れ子 object を deep 比較して pass', () => {
    const spy = createToolSpy();
    spy.record('Read', JSON.stringify({ a: { b: 1 } }));
    expect(() => assertToolCalledWith(spy, 'Read', { a: { b: 1 } })).not.toThrow();
  });

  it('TC-022 key 数が異なれば throw', () => {
    const spy = createToolSpy();
    spy.record('Read', JSON.stringify({ a: 1 }));
    expect(() => assertToolCalledWith(spy, 'Read', { a: 1, b: 2 })).toThrow(
      /no call matched expected args/,
    );
  });

  it('TC-023 null と object の比較を TypeError ではなく assertion 失敗にする', () => {
    // `deepEquals` の `a === null || b === null` を守る。 この行が無いと `null` が
    // object 分岐へ落ち、 `Object.keys(null)` が TypeError を投げて assertion の
    // 失敗ではなく実装の crash になる。
    //
    // **等価な null 同士では到達しない**。 先頭の `a === b` が `null === null` を
    // true で返して抜けるため、 `{a:null}` vs `{a:null}` は分岐を通らない (最初に
    // 書いた TC はこれで、 行を消しても pass した)。 片側だけ null にする。
    const spy = createToolSpy();
    spy.record('Read', JSON.stringify({ a: null }));
    expect(() => assertToolCalledWith(spy, 'Read', { a: {} })).toThrow(
      /no call matched expected args/,
    );
  });
});

// TC-018 は名前だけ見ると `reset で counter が 0 に戻る` (:33) が覆っているが、 body は
// `getCalls()` の件数しか見ておらず `assertToolCalled` を 1 度も呼んでいない。 候補があること
// と覆われていることは別で、 spec の判定を `既覆` と断定していたらこの 1 件は永久に書かれない。
describe('assertToolCalled — reset 後の記録', () => {
  it('TC-018 reset 後は assertToolCalled が throw する', () => {
    const spy = createToolSpy();
    spy.record('Read', '{}');
    spy.reset();
    expect(() => assertToolCalled(spy, 'Read')).toThrow(/never invoked/);
  });
});
