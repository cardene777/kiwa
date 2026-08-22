// live suite が使う Docker image を、timeout の付いた hook に入る前に揃える (Issue #2159)。
//
// ## なぜ要るか
//
// image が cache に無い machine では `container.start()` が pull を含むため、
// `beforeAll` の timeout (120s / 180s) に達して落ちる。 問題を確認した local run では
// cold の 1 container が 81.5 秒、image が揃った後の suite 全体が 21.9 秒だった。
// いずれも 1 回の環境依存な観測値で、timeout や性能の保証値ではない。
//
// 落ちた時の message は `Hook timed out in 120000ms` だけで、**待っていた相手を
// 名指ししない**。 pull を別 hook に分ければ、待ちの理由が message に出る。
//
// ## なぜ timeout を伸ばさないか
//
// 適切な値が回線速度に依存する。 遅い回線では同じ失敗が別の数字で戻り、速い回線では
// 壊れた時の待ちが伸びるだけになる。 image の有無は**その場で確かめられる事実**で、
// pull にどれだけかかるかとは独立している。
//
// ## ryuk の image 名を literal で持たない
//
// testcontainers は、ryuk が有効で既存 reaper が無い通常経路では、対象 container を
// 作る前に reaper container を立てる (対象 image 自体の pull はそれより先)。 その image
// 名は testcontainers 側が決めるので、こちらで `testcontainers/ryuk:0.11.0` と書くと
// 更新で静かにずれる。 `REAPER_IMAGE` を読み、読めなければ **ryuk の先読みだけを
// 諦める** (残りの image は先読みする)。
//
// ## docker が無い時に throw しない
//
// live suite は docker 不在を skip として扱う。 先読みが throw すると、その skip 経路が
// 「docker はあるが pull に失敗した」 と同じ形で潰れる。 **判定は既存 hook に残す**。

/** live suite が名指しで使う image。 `setup-orm-env.ts` の既定と一致させる。 */
export const POSTGRES_IMAGE = 'postgres:16-alpine';
export const MYSQL_IMAGE = 'mysql:8.4';
export const DB_IMAGES = [POSTGRES_IMAGE, MYSQL_IMAGE] as const;

/** `listImages()` が返す要素のうち、本 helper が見る field だけ。 */
export interface TaggedImage {
  RepoTags?: string[] | undefined;
}

/** 本 helper が触る docker の口。 test から差し替える。 */
export interface DockerImageClient {
  listImages(): Promise<TaggedImage[]>;
  pull(image: string): Promise<void>;
}

export interface EnsureLiveImagesResult {
  /** 既に cache にあった image。 */
  present: string[];
  /** この呼出で pull した image。 */
  pulled: string[];
  /** 名前を解決できず先読みを諦めた対象。 空なら全て解決できた。 */
  skipped: string[];
  /** docker を引けなかった場合の理由。 引けたなら `null`。 */
  unavailable: string | null;
}

/** 進捗を伝える口。 既定は `console.error` (test の stdout と混ぜない)。 */
export type Notify = (message: string) => void;

export interface EnsureLiveImagesOptions {
  /** 呼出元の suite が実際に使う DB image。 */
  dbImages?: readonly string[];
  notify?: Notify;
  resolveReaper?: () => Promise<string | null>;
}

/**
 * testcontainers が使う reaper image の名前を返す。
 *
 * root export に無いため内部 path から読む。 読めない場合は `null` を返して
 * 呼出側に諦めさせる = literal で写すと version がずれる。
 */
export async function reaperImage(): Promise<string | null> {
  try {
    const mod = (await import('testcontainers/build/reaper/reaper.js')) as {
      REAPER_IMAGE?: unknown;
    };
    return typeof mod.REAPER_IMAGE === 'string' ? mod.REAPER_IMAGE : null;
  } catch {
    return null;
  }
}

/** `listImages()` の結果を tag の集合へ畳む。 */
function taggedImages(infos: TaggedImage[]): Set<string> {
  const out = new Set<string>();
  for (const info of infos) {
    for (const tag of info.RepoTags ?? []) out.add(tag);
  }
  return out;
}

/**
 * live suite が要る image を揃える。
 *
 * **揃っている時は pull を 1 件も呼ばない**。 ただし reaper 名の解決と
 * `listImages()` は行うので、cache 済み経路も zero-cost の即 return ではない。
 * docker を引けない時は `unavailable` を立てて返す (throw しない)。
 */
export async function ensureLiveImages(
  client: DockerImageClient,
  options: EnsureLiveImagesOptions = {},
): Promise<EnsureLiveImagesResult> {
  const {
    dbImages = DB_IMAGES,
    notify = (message: string) => console.error(message),
    resolveReaper = reaperImage,
  } = options;
  const skipped: string[] = [];
  const reaper = await resolveReaper();
  if (reaper === null) {
    skipped.push('reaper (testcontainers の REAPER_IMAGE を読めなかった)');
    notify(
      '[@kiwa-lab/orm] testcontainers の REAPER_IMAGE を読めないため reaper image の' +
        ' 先読みを諦めます。 残りの image は先読みします',
    );
  }
  const wanted = reaper === null ? [...dbImages] : [...dbImages, reaper];

  let cached: Set<string>;
  try {
    cached = taggedImages(await client.listImages());
  } catch (caught) {
    const reason = caught instanceof Error ? caught.message : String(caught);
    return { present: [], pulled: [], skipped, unavailable: reason };
  }

  const present: string[] = [];
  const missing: string[] = [];
  for (const image of wanted) {
    (cached.has(image) ? present : missing).push(image);
  }
  // 揃っている時の早期 return は置かない。 下の loop が 0 回で同じ値を返すため、
  // 分岐を足しても **観測できる違いが 1 つも無い** (変異試験で残存したので外した)。
  // 欠けている一覧は **loop の外で 1 度だけ**言う。 loop 内で毎回並べると、
  // 「今どれを待っているか」 が全体一覧に埋もれる。 分けておくと、
  // 一覧を出す責務と個別の進捗を出す責務を別々に検査できる。
  if (missing.length > 0) {
    notify(
      `[@kiwa-lab/orm] Docker image が cache にありません: ${missing.join(', ')}` +
        ' (初回は数分かかります。 完了するまで live test は始まりません)',
    );
  }
  const pulled: string[] = [];
  for (const image of missing) {
    notify(`[@kiwa-lab/orm] pull 開始: ${image}`);
    try {
      await client.pull(image);
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : String(caught);
      throw new Error(`Docker image の pull に失敗しました: ${image}: ${reason}`, {
        cause: caught,
      });
    }
    pulled.push(image);
    notify(`[@kiwa-lab/orm] pull 完了: ${image}`);
  }
  return { present, pulled, skipped, unavailable: null };
}

/**
 * 実 dockerode を `DockerImageClient` へ写す。 dockerode を import できない形
 * (peer 未 install) では `null` を返し、呼出側に先読みを諦めさせる。
 *
 * 本 adapter は薄い。 分岐は「import できたか」 だけで、pull の進捗待ちを
 * callback から Promise へ畳む以外の判断を持たない。
 */
export async function openDockerImageClient(): Promise<DockerImageClient | null> {
  let docker: {
    listImages(): Promise<TaggedImage[]>;
    pull(image: string, cb: (err: unknown, stream: unknown) => void): void;
    modem: {
      followProgress(
        stream: unknown,
        onFinished: (err: unknown) => void,
      ): void;
    };
  };
  try {
    const { default: Docker } = (await import('dockerode')) as unknown as {
      default: new () => typeof docker;
    };
    docker = new Docker();
  } catch {
    return null;
  }
  return {
    listImages: () => docker.listImages(),
    pull: (image: string) =>
      new Promise<void>((resolve, reject) => {
        docker.pull(image, (err, stream) => {
          if (err || stream === undefined || stream === null) {
            reject(err ?? new Error(`pull stream missing: ${image}`));
            return;
          }
          docker.modem.followProgress(stream, (finishErr) => {
            if (finishErr) reject(finishErr);
            else resolve();
          });
        });
      }),
  };
}
