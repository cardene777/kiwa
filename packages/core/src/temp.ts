import { mkdtempSync, lstatSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';

/**
 * 全 adapter が共有する temp dir の名前空間。
 *
 * 回収はこの prefix に一致し、 **かつ自分たちが書いた形の名前を持つ** entry だけを
 * 対象にする。 prefix だけを条件にすると、 利用者が同じ名前で作った dir を消す。
 */
const NAMESPACE = 'kiwa-';

/**
 * 回収の既定閾値。 これより古い temp dir を次回起動時に消す。
 */
const DEFAULT_RECLAIM_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * 閾値の下限。 これを下回る値は下限に切り上げる。
 *
 * 閾値は保護の一部でしかない (稼働中かどうかは PID で見る) が、 縮める方向の上書きを
 * 許すと PID が再利用された時の当たり判定だけが残る。 伸ばす方向だけを許す。
 */
const RECLAIM_FLOOR_MS = 60 * 60 * 1000;

export interface ManagedTempDir {
  /** 実体の絶対 path。 */
  readonly path: string;
  /** 明示的に回収する。 成功するまで何度でも呼べる。 */
  dispose(): void;
}

export interface ManagedTempDirOptions {
  /**
   * 名前空間の中で使う識別子。 どの adapter が掘ったかを読めるようにする。
   *
   * path の区切りと `.` / `..` は受けない。 `join` が正規化するため、 通すと
   * 名前空間の外に dir を作れてしまう。
   */
  label?: string;
  /** 掘る先。 既定は `os.tmpdir()`。 相対 path は呼出時の cwd で絶対化する。 */
  root?: string;
  /** 回収の閾値 (ミリ秒)。 下限は 1 時間で、 それ未満は下限に切り上げる。 */
  reclaimAfterMs?: number;
}

/** `process.on('exit')` を二重登録しないための番兵。 */
let exitHookInstalled = false;

/** まだ回収できていない dir。 プロセス終了時にまとめて消す。 */
const outstanding = new Set<string>();

/**
 * 回収の走査を済ませた root。
 *
 * 走査は root 直下の全 entry を同期で読む。 掘るたびに繰り返すと、 entry 数 N ・
 * 作成回数 M に対して O(M×N) の同期 I/O になる (実機の `$TMPDIR` は 2 万 entry を
 * 超えることがある)。 残骸は「前回までの実行が残した物」 なので、 プロセスごとに
 * 1 度見れば足りる。
 */
const scannedRoots = new Set<string>();

/**
 * label に使える形。 path の区切りと `.` を含む形を弾く。
 *
 * `join(root, 'kiwa-' + label + ...)` は `..` を正規化して root の外へ出る。
 * `cli-test` の `prefix` のように公開 option から届くため、 呼出側の善意に頼らない。
 */
const LABEL_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * 作成時刻と PID を dir 名に埋める。
 *
 * **mtime では測れない**。 temp dir は中身を書くたびに mtime が進むため、 使い続けて
 * いる dir ほど「新しい」 と出て、 放置された dir と区別が付かない。
 *
 * **birthtime も使わない**。 filesystem によって取れず、 何より「自分たちが作った dir
 * か」 を判定できない。 名前に埋めれば、 読めたこと自体が「この形で作った」 証拠になる。
 *
 * PID を持つのは、 別 process が今まさに使っている dir を年齢だけで消さないため。
 */
function encodePrefix(label: string, now: number): string {
  return `${NAMESPACE}${label}-${now}-${process.pid}-`;
}

interface DecodedName {
  createdAt: number;
  pid: number;
}

/**
 * PID の上限。 これを超える値は OS が割り当てないため、 自分たちが書いた名前ではない。
 *
 * Linux の `pid_max` は既定 4194304、 macOS は 99998。 大きい方に合わせて弾く値を決める。
 * 上限を持たないと、 `process.kill` が範囲外で投げる error を「居ない」 と読む経路に
 * 偽装名を流し込める。
 */
const PID_MAX = 4_194_304;

/** `mkdtemp` が prefix の後ろに足す乱数。 現状 6 文字で、 長くなる方向には許容する。 */
const MKDTEMP_SUFFIX = /^[A-Za-z0-9]{6,}$/;

/** 10 進の正準表記か。 `0x10` / ` 12 ` / `012` / `1e3` を弾く。 */
function isCanonicalDecimal(text: string, value: number): boolean {
  return String(value) === text;
}

/**
 * dir 名から作成時刻と PID を読む。 **自分たちが書いた形と厳密に一致する時だけ** 返す。
 *
 * `kiwa-<label>-<epochMs>-<pid>-<mkdtemp の乱数>`。 label 自体が `-` を含みうるので、
 * 後ろから数えて位置を決める。
 *
 * 数値として読めるだけでは足りない。 `Number` は `0x10` も ` 12 ` も受けるため、
 * 「生成し得ない名前」 が通ると他者の dir を削除対象に引き込む。 label ・ 時刻 ・
 * PID ・ 乱数のすべてを、 こちらが書ける形かで検証する。
 *
 * **null を返した entry は消さない**。 名前を読めないことは「自分たちが作っていない」
 * ことを意味する。 利用者が `$TMPDIR` に置いた `kiwa-cache` のような dir がここに来る。
 */
function decodeName(name: string): DecodedName | null {
  if (!name.startsWith(NAMESPACE)) return null;
  const segments = name.split('-');
  // kiwa / label(1 つ以上) / ts / pid / rand
  if (segments.length < 5) return null;

  const suffix = segments[segments.length - 1] ?? '';
  const pidText = segments[segments.length - 2] ?? '';
  const createdAtText = segments[segments.length - 3] ?? '';
  const label = segments.slice(1, segments.length - 3).join('-');

  if (!MKDTEMP_SUFFIX.test(suffix)) return null;
  if (!LABEL_PATTERN.test(label)) return null;

  const createdAt = Number(createdAtText);
  const pid = Number(pidText);
  if (!Number.isSafeInteger(createdAt) || createdAt <= 0) return null;
  if (!isCanonicalDecimal(createdAtText, createdAt)) return null;
  if (!Number.isSafeInteger(pid) || pid <= 0 || pid > PID_MAX) return null;
  if (!isCanonicalDecimal(pidText, pid)) return null;

  return { createdAt, pid };
}

/**
 * その PID のプロセスが今も居るか。
 *
 * **居ないと言い切れる時だけ false を返す**。 `ESRCH` (そんなプロセスは無い) 以外の
 * error は「確かめられなかった」 であって「居ない」 ではない。 `EPERM` は別 user の
 * プロセスが居る証拠だし、 引数が範囲外なら判定自体が成立していない。 どちらも
 * 残す側に倒す = 削除は「居ないと確認できた」 場合に限る。
 */
function ownerAlive(pid: number): boolean {
  if (pid === process.pid) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
}

/**
 * 閾値を超え、 かつ作った process が居なくなった temp dir を回収する。
 *
 * **走査は root 直下 1 階層に限る**。 配下を再帰で見ると `$TMPDIR` の規模に比例して
 * 遅くなる。
 *
 * symlink は辿らずその場で判定から外す。 辿ると名前空間の外を消しうる。
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
    const decoded = decodeName(name);
    if (decoded === null) continue;
    if (now - decoded.createdAt < thresholdMs) continue;
    if (ownerAlive(decoded.pid)) continue;

    const entryPath = join(root, name);
    try {
      if (!lstatSync(entryPath).isDirectory()) continue;
    } catch {
      continue;
    }

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
 * **signal は捕捉しない**。 `SIGINT` に listener を足すと Node の既定動作 (終了) が
 * 抑止され、 `Ctrl-C` が効かないライブラリになる。 利用者のプロセス制御を書き換えるのは
 * adapter の責務を越える。
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
 * 正常終了は `dispose` が、 異常終了は次回起動時の回収が受ける。 adapter 側が
 * `node:fs` の `mkdtemp` を直接呼ぶと後者が効かないため、 一時 dir はすべて本 API を
 * 通す (`tests/release-smoke/tests/temp-resource-cleanup.test.ts` が機械検査する)。
 *
 * **消すのは自分たちが作った形の dir だけ**。 名前から作成時刻と PID を読めた entry に
 * 限り、 閾値を超え、 かつ作った process が居なくなっている場合に消す。
 *
 * **回収の失敗は呼出を止めない**。 掘れることの方が利用者にとって重要で、 消せな
 * かった分は次回に持ち越せる。
 */
export function createManagedTempDir(opts: ManagedTempDirOptions = {}): ManagedTempDir {
  const label = opts.label ?? 'temp';
  if (!LABEL_PATTERN.test(label)) {
    throw new Error(
      `createManagedTempDir: label は ${LABEL_PATTERN.source} に一致する必要があります` +
        ` (受け取った値 ${JSON.stringify(label)})。` +
        ` path の区切りと "." を含む値は名前空間の外に dir を作れるため受けません。`,
    );
  }

  // 相対 path のまま保持すると、 呼出側が `chdir` した後の `dispose` と exit hook が
  // 別の場所の同名 dir を消しうる。 掘る前に絶対化する。
  //
  // `resolve` は絶対 path も通す。 末尾の区切りを落として正準形にするため、 絶対
  // かどうかで分岐しない = `/tmp/x/` をそのまま保持すると、 後段の containment 判定が
  // 区切りの重なりで誤る。
  const root = resolve(opts.root ?? tmpdir());

  const thresholdMs = Math.max(opts.reclaimAfterMs ?? DEFAULT_RECLAIM_AFTER_MS, RECLAIM_FLOOR_MS);
  const now = Date.now();

  if (!scannedRoots.has(root)) {
    scannedRoots.add(root);
    reclaim(root, now, thresholdMs);
  }

  const path = mkdtempSync(join(root, encodePrefix(label, now)));
  // `mkdtemp` の戻り値が root の外に出ていないことを確かめる。 label は検証済だが、
  // 判定を名前の形だけに委ねず、 実際に掘れた場所で裏を取る。
  //
  // 文字列の前方一致では測れない。 `root` が `/` の時に区切りが重なり、 正当な path を
  // 外と判定する。 `relative` なら区切りの表記に依らず「上に出たか」 だけを見られる。
  const inside = relative(root, path);
  if (inside === '' || inside.startsWith('..') || isAbsolute(inside)) {
    try {
      rmSync(path, { recursive: true, force: true });
    } catch {
      // 消せなくても、 返さないことの方が重要。
    }
    throw new Error(`createManagedTempDir: 掘った dir が root の外にあります (${path})`);
  }

  outstanding.add(path);
  installExitHook();

  return {
    path,
    dispose(): void {
      try {
        rmSync(path, { recursive: true, force: true });
      } catch {
        // 消せなかった時は追跡に残す。 exit hook と次の `dispose` が再試行できる。
        return;
      }
      outstanding.delete(path);
    },
  };
}

/** test から回収の走査状態を戻すための入口。 production からは呼ばない。 */
export function __resetTempScanStateForTests(): void {
  scannedRoots.clear();
}
