import { afterEach, describe, expect, it } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import {
  expectNoViolations,
  reportViolations,
  runAxe,
  type AxeResults,
} from '@kiwa-lab/a11y';

import { Counter } from '../../src/counter.js';

// spec = tests/spec/integration/test-spec-counter.a11y.md

/** WCAG 2.1 AA までを対象にする。 spec の WCAG-rule column に対応する。 */
const WCAG_21_AA = {
  runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  // jsdom に layout / canvas は無い。 実 browser が必要な rule は Playwright 側で扱う。
  rules: { 'color-contrast': { enabled: false } },
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('Counter a11y (mode: jsdom)', () => {
  it('T-A11Y-001 既定 render に違反が無い', async () => {
    const { container } = render(<Counter />);
    const results = await runAxe({ context: container, runOptions: WCAG_21_AA });
    expect(results.violations).toEqual([]);
  });

  it('T-A11Y-002 max 到達時も違反が無い', async () => {
    // `+` が disabled になり `role="status"` が現れる状態。 状態が変わると
    // 名前や role の付き方も変わるため、 初期状態だけでは覆えない。
    const { container } = render(<Counter initial={2} max={2} />);
    const results = await runAxe({ context: container, runOptions: WCAG_21_AA });
    expect(results.violations).toEqual([]);
  });

  it('T-A11Y-003 名前の無いボタンを検出する', async () => {
    // **検査自身の識別力**。 違反が無い component だけを見ていると、 axe が実際には
    // 何も走っていなくても全 TC が通る。 違反を 1 件通して出ることを確かめる。
    document.body.innerHTML = '<div id="probe"><button type="button"></button></div>';
    const results = await runAxe({
      context: document.getElementById('probe') as Element,
      runOptions: WCAG_21_AA,
    });
    expect(results.violations.map((v) => v.id)).toContain('button-name');
  });

  it('T-A11Y-004 走査範囲を context で絞る', async () => {
    const { container } = render(<Counter />);
    // 範囲外に違反を置く。 `context` が効いていれば拾わない。
    const outside = document.createElement('div');
    outside.innerHTML = '<button type="button"></button>';
    document.body.appendChild(outside);

    const results = await runAxe({ context: container, runOptions: WCAG_21_AA });
    expect(results.violations).toEqual([]);
  });
});

describe('閾値の既定 (mode: jsdom)', () => {
  /** minor 1 件だけを持つ合成 results。 axe を通さずに閾値の分岐だけを見る。 */
  function minorOnly(): AxeResults {
    return {
      violations: [
        {
          id: 'synthetic-minor',
          impact: 'minor',
          description: '',
          help: '',
          helpUrl: '',
          nodes: [{ target: ['#x'], html: '<span></span>' }],
        },
      ],
      passes: [],
      incomplete: [],
      inapplicable: [],
    };
  }

  it('T-A11Y-005 既定の閾値は minor から塞ぐ', () => {
    // 既定は `maxImpact: 'minor'` = minor も blocking に入る。
    // 「serious 以上だけ落ちる」 と読むと、 minor を残したまま緑だと誤解する。
    const report = reportViolations(minorOnly());
    expect(report.blocking).toHaveLength(1);
  });

  it('T-A11Y-006 閾値を上げると minor は通す', () => {
    const report = reportViolations(minorOnly(), { maxImpact: 'serious' });
    expect(report.blocking).toEqual([]);
  });
});

describe('assertion helper (mode: jsdom)', () => {
  it('T-A11Y-007 違反 0 件なら例外を投げない', async () => {
    const { container } = render(<Counter />);
    const results = await runAxe({ context: container, runOptions: WCAG_21_AA });
    // `expect` を渡すのは helper 側の signature。 test runner に依存しないよう
    // assertion 関数を注入で受ける形になっている。
    expectNoViolations(results, expect as unknown as Parameters<typeof expectNoViolations>[1]);
  });
});
