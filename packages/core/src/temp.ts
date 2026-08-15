import { mkdtempSync, lstatSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * 全 adapter が共有する temp dir の名前空間。
 *
 * 回収はこの prefix に一致する entry だけを対象にする。 利用者の `$TMPDIR` には
 * 無関係な dir が同居するため、 prefix を外すと他人の物を消す。
 */
const NAMESPACE = 'kiwa-';

/**
 * 回収の既定閾値。 これより古い temp dir を次回起動時に消す。
 *
 * 稼働中の temp dir を守っているのはこの閾値だけなので、 縮める方向の上書きは
 * 受けない (§ `reclaimAfterMs` の下限)。
 */
const DEFAULT_RECLAIM_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * 閾値の下限。 これを下回る値は下限に切り上げる。
 *
 * 閾値を縮めることは「稼働中を消さない」 という保証そのものを外すことと等しい。
 * 伸ばす方向だけを許す。
 */
const RECLAIM_FLOOR_MS = 60 * 60 * 1000;

export interface ManagedTempDir {
  /** 実体の絶対 path。 */
  readonly path: string;
  /** 明示的に回収する。 2 度呼んでも安全。 */
  dispose(): void;
}

export interface ManagedTempDirOptions {
  /** 名前空間の後ろに付ける識別子。 どの adapter が掘ったかを読めるようにする。 */
  label?: string;
  /** 掘る先。 既定は `os.tmpdir()`。 */
  root?: string;
  /** 回収の閾値 (ミリ秒)。 下限は 1 時間で、 それ未満は下限に切り上げる。 */
  reclaimAfterMs?: number;
}

/** `process.on('exit')` を二重登録しないための番兵。 */
let exitHookInstalled = false;

/** まだ `dispose` されていない dir。 プロセス終了時にまとめて消す。 */
const outstanding = new Set<string>();

/**
 * 作成時刻を dir 名に埋める。
 *
 * **mtime では測れない**。 temp dir は中身を書くたびに mtime が進むため、 使い続けて
 * いる dir ほど「新しい」 と出て、 放置された dir と区別が付かない。 逆に中身だけを
 * 更新する使い方では dir 自身の mtime が動かず、 稼働中を古いと誤判定する。
 *
 * birthtime は filesystem によって取れない (epoch 0 が返る) ため、 単独では使えない。
 * 名前に埋めれば必ず読めるので、 これを主にして birthtime を補助にする。
 */
function encodeCreatedAt(label: string, now: number): string {
  return `${NAMESPACE}${label}-${now}-`;
}

/**
 * dir 名から作成時刻を読む。 読めなければ null。
 *
 * `kiwa-<label>-<epochMs>-<mkdtemp の乱数>` の形だけを受ける。 label 自体が `-` を
 * 含みうるので、 後ろから 2 つ目の segment を時刻として読む。
 */
function decodeCreatedAt(name: string): number | null {
  if (!name.startsWith(NAMESPACE)) return null;
  const segments = name.split('-');
  if (segments.length < 3) return null;
  const candidate = Number(segments[segments.length - 2]);
  if (!Number.isSafeInteger(candidate) || candidate <= 0) return null;
  return candidate;
}

/**
 * 「この dir は消してよいほど古いか」 を返す。
 *
 * **名前に埋めた時刻を主にする**。 この値は本 module が作成時に書いたもので、 以降
 * 変化しない。 birthtime は filesystem によって epoch 0 しか返さないため、 名前を
 * 読めなかった dir (本 module が作る前からある物、 名前を変えられた物) の補助に回す。
 *
 * どちらも読めない時は false を返す (fail-closed)。 「古いと確かめられた」 場合だけ
 * 消し、 「古いか分からない」 は残す。
 */
function isReclaimable(entryPath: string, name: string, now: number, thresholdMs: number): boolean {
  const fromName = decodeCreatedAt(name);
  if (fromName !== null) return now - fromName >= thresholdMs;

  try {
    const birthMs = statSync(entryPath).birthtimeMs;
    // epoch 0 は「取れなかった」 を意味する filesystem がある。 値として信じない。
    if (Number.isFinite(birthMs) && birthMs > 0) return now - birthMs >= thresholdMs;
  } catch {
    // 権限や競合で読めない dir は判定材料が無いので残す。
  }

  // 名前も birthtime も読めない形。 birthtime を返さない filesystem でしか起きず、
  // test から作れないため覆えていない (残す側に倒してある)。
  return false;
}

/**
 * 閾値を超えた temp dir を回収する。
 *
 * **走査は root 直下 1 階層に限る**。 配下を再帰で見ると利用者の `$TMPDIR` の規模に
 * 比例して遅くなり、 毎回の `createManagedTempDir` が重くなる。
 *
 * symlink は辿らずその場で判定から外す。 辿ると namespace の外を消しうる。
 */
function reclaim(root: string, now: number, thresholdMs: number): void {
  let names: string[];
  try {
    names = readdirSync(root);
  } catch {
    // root を読めない環境でも temp dir の作成自体は続けられる。
    return;
  }

  for (const name of names) {
    if (!name.startsWith(NAMESPACE)) continue;
    const entryPath = join(root, name);

    try {
      const stat = lstatSync(entryPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    if (!isReclaimable(entryPath, name, now, thresholdMs)) continue;

    try {
      rmSync(entryPath, { recursive: true, force: true });
    } catch {
      // 1 件消せなくても残りの回収は続ける。
    }
  }
}

/**
 * プロセス終了時に取りこぼしを消す。
 *
 * **signal は捕捉しない**。 `SIGINT` に listener を足すと Node の既定動作
 * (終了) が抑止され、 `Ctrl-C` が効かないライブラリになる。 利用者のプロセス制御を
 * 書き換えるのは adapter の責務を越える。
 *
 * `exit` は同期処理しか走らせられないため `rmSync` を使う。 `SIGKILL` と OOM は
 * ここに到達しないので、 その分は次回起動時の回収が受ける。
 */
function installExitHook(): void {
  if (exitHookInstalled) return;
  exitHookInstalled = true;
  process.on('exit', () => {
    for (const path of outstanding) {
      try {
        rmSync(path, { recursive: true, force: true });
      } catch {
        // 終了処理では報告先が無い。 次回起動時の回収に委ねる。
      }
    }
    outstanding.clear();
  });
}

/**
 * 回収経路を持つ temp dir を掘る。
 *
 * 正常終了は `dispose` が、 異常終了は次回呼出時の回収が受ける。 adapter 側が
 * `node:fs` の `mkdtemp` を直接呼ぶと後者が効かないため、 一時 dir はすべて本 API を
 * 通す (`tests/release-smoke/tests/temp-resource-cleanup.test.ts` が機械検査する)。
 *
 * **回収の失敗は呼出を止めない**。 掘れることの方が利用者にとって重要で、 消せな
 * かった分は次回に持ち越せる。
 */
export function createManagedTempDir(opts: ManagedTempDirOptions = {}): ManagedTempDir {
  const root = opts.root ?? tmpdir();
  const label = opts.label ?? 'temp';
  const thresholdMs = Math.max(opts.reclaimAfterMs ?? DEFAULT_RECLAIM_AFTER_MS, RECLAIM_FLOOR_MS);
  const now = Date.now();

  reclaim(root, now, thresholdMs);

  const path = mkdtempSync(join(root, encodeCreatedAt(label, now)));
  outstanding.add(path);
  installExitHook();

  let disposed = false;
  return {
    path,
    dispose(): void {
      if (disposed) return;
      disposed = true;
      outstanding.delete(path);
      try {
        rmSync(path, { recursive: true, force: true });
      } catch {
        // 消せなくても次回起動時の回収が受ける。
      }
    },
  };
}
