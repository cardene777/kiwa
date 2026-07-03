import { hashMarkup } from './dom.js';
import type {
  CanvasElement,
  StoryEntry,
  VisualBaseline,
  VisualDiff,
  VisualReviewAction,
  VisualReviewEntry,
} from './types.js';

/**
 * Chromatic 型の visual regression mock。 real Chromatic は Storybook 8 を
 * headless で snapshot 撮り、 baseline JSON を server 側に置いて diff を
 * pixel single で計算する。 mock harness は browser を起動せず、 mount 後の
 * MockNode を `renderMarkup` で pseudo-HTML 化 → SHA-256 hash → hash 比較で
 * changed 判定を行う (pixel diff は hash 完全一致 = 0、 不一致 = 1、
 * partial diff の連続値は mock 対象外)。
 *
 * mock で意味のある semantic は 4 つ ...
 * (1) baseline capture (未登録なら status='new'、 hash を保存)
 * (2) current capture + diff (hash 一致で passed、 不一致で failed / changed)
 * (3) diffThreshold の適用 (StoryEntry.parameters.chromatic.diffThreshold)
 * (4) accept / reject workflow (accept で baseline を current で置換)
 *
 * multi viewport support = parameters.chromatic.viewports に列挙された viewport
 * 名を 1 回ずつ capture し、 viewport × storyId 単位で baseline / diff を管理。
 */

export interface ChromaticVisualMock {
  /** baseline / current 群を全 clear。 test 間の isolation 用。 */
  reset(): void;
  /** baseline を明示 seed (test setup で初期状態を作る時使う)。 */
  seedBaseline(input: {
    storyId: string;
    viewport: string;
    markup: string;
    capturedAt?: number;
  }): VisualBaseline;
  /** 1 story × 1 viewport を capture、 baseline 不在なら status='new'。 */
  capture(input: {
    entry: StoryEntry;
    canvas: CanvasElement;
    viewport?: string;
    now?: number;
  }): VisualDiff;
  /**
   * 1 story を parameters.chromatic.viewports 全 viewport で一括 capture。
   * viewports 未指定 or 空なら 'default' viewport 1 件のみ。 disabled story は
   * skip (空配列を返す)。
   */
  captureAll(input: {
    entry: StoryEntry;
    canvas: CanvasElement;
    now?: number;
  }): VisualDiff[];
  /** accept / reject 1 件。 accept は baseline を current 相当で置換する。 */
  review(input: {
    storyId: string;
    viewport: string;
    action: VisualReviewAction;
    reviewedAt?: number;
  }): VisualReviewEntry;
  /** review 履歴一覧 (test で workflow を assert する時使う)。 */
  reviewHistory(): VisualReviewEntry[];
  /** baseline 一覧 (test 用 introspection)。 */
  baselines(): VisualBaseline[];
}

/**
 * ChromaticVisualMock を新規作成する。 baseline / current / review を全て
 * in-memory Map で保持し、 reset() で全 clear できる (test isolation 用)。
 */
export function createChromaticVisualMock(config: ChromaticConfig = {}): ChromaticVisualMock {
  const baselines = new Map<string, VisualBaseline>();
  const currents = new Map<string, VisualBaseline>();
  const reviews: VisualReviewEntry[] = [];
  const defaultViewport = config.defaultViewport ?? 'default';
  const defaultThreshold = config.defaultDiffThreshold ?? 0;
  const nowFn = config.now ?? (() => Date.now());

  const keyOf = (storyId: string, viewport: string): string => `${storyId}::${viewport}`;

  return {
    reset(): void {
      baselines.clear();
      currents.clear();
      reviews.length = 0;
    },
    seedBaseline(input): VisualBaseline {
      const baseline: VisualBaseline = {
        storyId: input.storyId,
        viewport: input.viewport,
        markup: input.markup,
        hash: hashMarkup(input.markup),
        capturedAt: input.capturedAt ?? nowFn(),
      };
      baselines.set(keyOf(input.storyId, input.viewport), baseline);
      return baseline;
    },
    capture(input): VisualDiff {
      const viewport = input.viewport ?? defaultViewport;
      if (input.entry.parameters.chromatic?.disable) {
        return {
          storyId: input.entry.id,
          viewport,
          baselineHash: '',
          currentHash: '',
          changed: false,
          pixelDiffRatio: 0,
          status: 'passed',
          threshold: defaultThreshold,
        };
      }
      const markup = input.canvas.toMarkup();
      const current: VisualBaseline = {
        storyId: input.entry.id,
        viewport,
        markup,
        hash: hashMarkup(markup),
        capturedAt: input.now ?? nowFn(),
      };
      currents.set(keyOf(input.entry.id, viewport), current);
      const baseline = baselines.get(keyOf(input.entry.id, viewport));
      const threshold = input.entry.parameters.chromatic?.diffThreshold ?? defaultThreshold;
      if (!baseline) {
        // 初回 capture — baseline として登録、 status='new' で返す
        baselines.set(keyOf(input.entry.id, viewport), current);
        return {
          storyId: input.entry.id,
          viewport,
          baselineHash: '',
          currentHash: current.hash,
          changed: false,
          pixelDiffRatio: 0,
          status: 'new',
          threshold,
        };
      }
      const changed = baseline.hash !== current.hash;
      const pixelDiffRatio = changed ? 1 : 0;
      const status: VisualDiff['status'] = pixelDiffRatio > threshold ? 'failed' : 'passed';
      return {
        storyId: input.entry.id,
        viewport,
        baselineHash: baseline.hash,
        currentHash: current.hash,
        changed,
        pixelDiffRatio,
        status,
        threshold,
      };
    },
    captureAll(input): VisualDiff[] {
      if (input.entry.parameters.chromatic?.disable) {
        return [];
      }
      const viewports = input.entry.parameters.chromatic?.viewports?.length
        ? input.entry.parameters.chromatic.viewports
        : [defaultViewport];
      const now = input.now ?? nowFn();
      return viewports.map((viewport) =>
        this.capture({
          entry: input.entry,
          canvas: input.canvas,
          viewport,
          now,
        }),
      );
    },
    review(input): VisualReviewEntry {
      const key = keyOf(input.storyId, input.viewport);
      const entry: VisualReviewEntry = {
        storyId: input.storyId,
        viewport: input.viewport,
        action: input.action,
        reviewedAt: input.reviewedAt ?? nowFn(),
      };
      reviews.push(entry);
      if (input.action === 'accept') {
        const current = currents.get(key);
        if (!current) {
          throw new Error(
            `ChromaticVisualMock.review — cannot accept ${key}, no current capture found. Run capture() first.`,
          );
        }
        baselines.set(key, { ...current, capturedAt: entry.reviewedAt });
      }
      // reject は baseline を保持したまま、 review 履歴だけ残す
      return entry;
    },
    reviewHistory(): VisualReviewEntry[] {
      return [...reviews];
    },
    baselines(): VisualBaseline[] {
      return Array.from(baselines.values());
    },
  };
}

export interface ChromaticConfig {
  /** viewport 名の default (未指定 story の 1 件 capture 時に使う)。 */
  defaultViewport?: string;
  /** parameters.chromatic.diffThreshold 未指定時の default。 default = 0 (完全一致で pass)。 */
  defaultDiffThreshold?: number;
  /** capturedAt / reviewedAt 用の deterministic time source (test 決定性)。 */
  now?: () => number;
}
