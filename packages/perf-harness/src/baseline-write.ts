/**
 * baseline を書くかどうかの決定を、 mock 経路と live 経路で共有する。
 *
 * この判断は 2 経路に分かれて実装されていた。 mock 経路 (`runPerf3Layer`) は
 * 「記録の無い op だけ書き足す」 経路を持ち、 live 経路 (`runPerf3LayerLive`) は
 * 「記録が 1 件も無い時だけ全件書く」 だけだった。 そのため live 経路は op を
 * 1 つ足しても baseline に載らず、 その op が永久に回帰判定から漏れた (#1740)。
 *
 * 経路ごとに条件を持つと、 片方を直した時にもう片方が古い前提を残す。 #1737 で
 * 実際に起きた (mock 側だけ比較できない理由を 7 通りに分けた結果、 live 側の
 * 文言が古い前提のまま残った)。 決定を 1 箇所に集める。
 */
import type { MeasureResult } from './types.js';

export interface BaselineWriteInput {
  /**
   * baseline から採った記録。 前提が違って採らなかった場合は null。
   *
   * null は「記録が 1 件も無い」 と同じに扱う。 前提が違う世代の値を採らないと
   * 決めた時点で、 今回測った op は全て「記録の無い op」 になるため、 全件が
   * 書き直しの対象になる。 前提の変化を別の分岐にすると同じ結果を 2 通りの
   * 経路で出すことになり、 片方が test に掛からなくなる。
   */
  prior: Record<string, MeasureResult> | null;
  /** 今回の実行で測った記録。 */
  current: Record<string, MeasureResult>;
  /** 測定そのものが成立している (GC を要求したなら使えている)。 */
  premiseValid: boolean;
  /** 上限判定を全 op が通った。 */
  hardGatePassed: boolean;
  /** 今回測っていない op を baseline から落とすか。 */
  prune: boolean;
  /**
   * 記録はあるのに書き直しが要る op を見分ける。 省略時は書き直さない。
   *
   * mock 経路は基準 op が食い違うようになった op をここで拾う。 拾わないと
   * key は既にあるので追記されず、 その op だけ永久に比較できない。
   */
  needsRefresh?: (key: string, prior: MeasureResult, current: MeasureResult) => boolean;
}

export interface BaselineWritePlan {
  /** 書込が起きるか。 report の注記に使う。 */
  written: boolean;
  /** 書くならこの中身をそのまま保存する。 `written` が false なら空。 */
  results: Record<string, MeasureResult>;
}

/**
 * 書込の可否と中身を決める。 保存そのものは呼出側が行う。
 *
 * 作り直しと追記のどちらにも、 測定が成立していること (`premiseValid`) と上限を
 * 通っていること (`hardGatePassed`) を課す。 GC を呼べない実行や上限を割った実行の
 * 値を基準に採ると、 壊れた状態が次回以降の比較対象になる。 新しい op だけを足す
 * 経路でも、 その値が成立していなければ意味は同じ。
 */
export function planBaselineWrite(input: BaselineWriteInput): BaselineWritePlan {
  const priorResults = input.prior ?? {};
  const currentKeys = new Set(Object.keys(input.current));
  // 今回測っていない op を落とすのは、 今回の op 一覧が完全である場合だけ。
  // 絞り込み実行で落とすと、 測っていない op の baseline が消える。
  const retained = input.prune
    ? Object.fromEntries(Object.entries(priorResults).filter(([key]) => currentKeys.has(key)))
    : priorResults;

  const needsRefresh = input.needsRefresh;
  const refreshedOps = Object.fromEntries(
    Object.entries(input.current).filter(([key, current]) => {
      const prior = priorResults[key];
      if (prior === undefined) return true;
      return needsRefresh === undefined ? false : needsRefresh(key, prior, current);
    }),
  );
  const staleDropped = Object.keys(priorResults).length !== Object.keys(retained).length;

  const measurable = input.premiseValid && input.hardGatePassed;
  // 書くものが何も無い実行では書かない。 同じ内容で書き直すと baseline の
  // mtime だけが動き、 いつの測定値かが追えなくなる。
  const written = measurable && (Object.keys(refreshedOps).length > 0 || staleDropped);
  return written
    ? { written, results: { ...retained, ...refreshedOps } }
    : { written, results: {} };
}

/** 1 op ぶんの履歴の更新指示。 */
export interface RatioHistoryUpdate {
  /** この実行で観測した「対象 p10 ÷ 基準 p10」。 */
  ratio: number;
}

/**
 * baseline の記録に、 この実行で観測した比を積む。
 *
 * 記録そのもの (p10 / samples) は動かさない。 動かすと比較の基準が毎回入れ替わって
 * 回帰を検出できなくなる (#1740 でそう決めた)。 積むのは「その op が実行をまたいで
 * どれだけ動くか」 を推定するための履歴だけ (#1739)。
 *
 * 古いものから捨てて上限 (`MAX_RATIO_HISTORY`) に収める。 上限を置くのは baseline の
 * file が実行のたびに伸び続けないようにするため。
 *
 * 履歴を明示的に捨てる経路は持たない。 記録が入れ替わる時 (`needsRefresh`) は新しい
 * record に履歴が付いていないので、 そこから自然に積み直しになる。
 *
 * 何も変わらなければ `changed: false` を返す。 同じ内容で書き直すと baseline の
 * mtime だけが動き、 いつの測定値かが追えなくなる。
 */
export function applyRatioHistory(
  results: Record<string, MeasureResult>,
  updates: Map<string, RatioHistoryUpdate>,
  maxEntries: number,
): { results: Record<string, MeasureResult>; changed: boolean } {
  if (updates.size === 0) return { results, changed: false };

  const next: Record<string, MeasureResult> = { ...results };
  let changed = false;

  for (const [key, update] of updates) {
    const record = next[key];
    if (record === undefined) continue;
    if (!Number.isFinite(update.ratio) || update.ratio <= 0) continue;

    const prior = record.ratioHistory ?? [];
    const appended = [...prior, update.ratio].slice(-maxEntries);
    // 中身が同じなら書き換えない。
    if (
      appended.length === (record.ratioHistory?.length ?? 0) &&
      appended.every((value, index) => value === record.ratioHistory?.[index])
    ) {
      continue;
    }
    next[key] = { ...record, ratioHistory: appended };
    changed = true;
  }

  return changed ? { results: next, changed } : { results, changed: false };
}

/** 比較が成立しなかった op の verdict。 */
export type UncomparableVerdict =
  | 'n/a (比較せず)'
  | 'n/a (baseline seeded)'
  | 'n/a (baseline 未保存)'
  | 'n/a (baseline 競合で未保存)';

/**
 * 比較できなかった op の verdict を決める。
 *
 * 3 通りを分ける。 記録があるのに比較できない実行 (`比較せず`)、 記録が無くて
 * 今回書いた実行 (`baseline seeded`)、 記録が無いのに書けなかった実行
 * (`baseline 未保存`)。
 *
 * 3 つ目を `seeded` と書くと、 読み手は「次回から比較される」 と読む。 実際には
 * 測定が成立していない (GC を呼べない / 上限を割った op がある) 限り同じ状態が
 * 続くので、 待っても比較は始まらない。
 *
 * `written` は実行全体で 1 つ。 同 module の別 op が上限を割ると 1 byte も
 * 書かれないため、 自分の測定が通っていても書けないことがある。 そのため
 * この判断は全 op を測り終えるまで確定せず、 呼出側は測定 loop の後で呼ぶ。
 */
export function uncomparableVerdict(
  hasPriorRecord: boolean,
  written: boolean,
  conflicted = false,
): UncomparableVerdict {
  if (hasPriorRecord) return 'n/a (比較せず)';
  if (written) return 'n/a (baseline seeded)';
  // 競合で見送った実行は、 測定が成立していない実行とは別。 前者は次の実行で普通に
  // 書けるが、 後者は上限違反等が直るまで同じ状態が続く。 同じ文言にすると読み手が
  // 直すべき対象を取り違える (#1757)。
  return conflicted ? 'n/a (baseline 競合で未保存)' : 'n/a (baseline 未保存)';
}
