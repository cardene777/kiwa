// `ensureLiveImages` の 4 経路を固定する (Issue #2159)。
//
// 実 docker は使わない。 client を注入して、揃っている / 欠けている / docker 不在 /
// reaper 名を読めない を別々に見る。 実 docker を使うと「image が cache にあるか」 が
// 実行環境で変わり、検査が環境の状態を測ることになる。
import { describe, expect, it } from 'vitest';

import {
  DB_IMAGES,
  ensureLiveImages,
  MYSQL_IMAGE,
  POSTGRES_IMAGE,
  reaperImage,
  type DockerImageClient,
  type TaggedImage,
} from './helpers/ensure-docker-images.js';

const RYUK = 'testcontainers/ryuk:9.9.9';

/** 指定した tag だけを持つ docker の口。 pull は呼ばれた image を記録する。 */
function fakeClient(tags: string[], onPull?: (image: string) => void): DockerImageClient {
  return {
    listImages: async (): Promise<TaggedImage[]> => tags.map((tag) => ({ RepoTags: [tag] })),
    pull: async (image: string) => {
      onPull?.(image);
    },
  };
}

describe('ensureLiveImages (#2159)', () => {
  it('T-EDI-001 揃っている時は pull を 1 件も呼ばない', async () => {
    const pulls: string[] = [];
    const notices: string[] = [];
    const result = await ensureLiveImages(
      fakeClient([...DB_IMAGES, RYUK], (image) => pulls.push(image)),
      {
        notify: (message) => notices.push(message),
        resolveReaper: async () => RYUK,
      },
    );
    expect(pulls, 'pull を呼んだ').toEqual([]);
    expect(result.pulled).toEqual([]);
    expect(result.present.slice().sort()).toEqual([...DB_IMAGES, RYUK].slice().sort());
    expect(result.unavailable).toBeNull();
    expect(notices, '揃っている時は何も言わない').toEqual([]);
  });

  it('T-EDI-002 suite が使う欠けた image だけを pull し、名前を message に出す', async () => {
    const pulls: string[] = [];
    const notices: string[] = [];
    const result = await ensureLiveImages(
      fakeClient([], (image) => pulls.push(image)),
      {
        dbImages: [MYSQL_IMAGE],
        notify: (message) => notices.push(message),
        resolveReaper: async () => RYUK,
      },
    );
    expect(pulls, 'suite が使う DB と reaper だけを pull する').toEqual([
      MYSQL_IMAGE,
      RYUK,
    ]);
    expect(result.present).toEqual([]);
    expect(result.pulled).toEqual([MYSQL_IMAGE, RYUK]);
    // 待っている相手が message から読めることが本 helper の目的。
    expect(notices[0], '最初の message に欠けている image 名が入る').toContain(
      MYSQL_IMAGE,
    );
    expect(notices[0]).toContain(RYUK);
    // 全体一覧と個別の進捗は別の責務。 一覧だけを見ていると「今どれを待っているか」 を
    // 落としても気付けない (変異試験で実際に残存した)。
    expect(
      notices.filter((message) => message.includes('pull 開始')),
      'pull 開始は image ごとに 1 本ずつ、対象を名指しで出す',
    ).toEqual([
      `[@kiwa-lab/orm] pull 開始: ${MYSQL_IMAGE}`,
      `[@kiwa-lab/orm] pull 開始: ${RYUK}`,
    ]);
    expect(pulls, '別 suite 専用の image は pull しない').not.toContain(POSTGRES_IMAGE);
  });

  it('T-EDI-003 docker を引けない時は throw せず理由を返す', async () => {
    const notices: string[] = [];
    const result = await ensureLiveImages(
      {
        listImages: async () => {
          throw new Error('connect ENOENT /var/run/docker.sock');
        },
        pull: async () => {
          throw new Error('pull は呼ばれてはいけない');
        },
      },
      {
        notify: (message) => notices.push(message),
        resolveReaper: async () => RYUK,
      },
    );
    expect(result.unavailable, 'docker 不在の理由を返す').toContain('docker.sock');
    expect(result.pulled).toEqual([]);
  });

  it('T-EDI-004 reaper 名を読めない時は残りだけ先読みする', async () => {
    const pulls: string[] = [];
    const notices: string[] = [];
    const result = await ensureLiveImages(
      fakeClient([], (image) => pulls.push(image)),
      {
        notify: (message) => notices.push(message),
        resolveReaper: async () => null,
      },
    );
    expect(pulls, 'reaper を除く 2 件を pull する').toEqual([...DB_IMAGES]);
    expect(result.skipped, '諦めた対象を返す').toHaveLength(1);
    expect(result.skipped[0]).toContain('REAPER_IMAGE');
    expect(notices[0], '諦めたことを message に出す').toContain('REAPER_IMAGE');
  });

  it('T-EDI-005 実 testcontainers から reaper 名を引ける', async () => {
    // 内部 path から読むため、testcontainers の更新で壊れうる。 壊れた時に
    // 「reaper だけ先読みしない」 へ静かに落ちるのを、ここで見えるようにする。
    const image = await reaperImage();
    expect(
      image,
      'REAPER_IMAGE を読めない (読めない場合 T-EDI-004 の経路へ落ちる)',
    ).not.toBeNull();
    if (image === null) return;
    expect(image.trim(), 'custom registry / repository を含む任意の有効な名前を許す').not.toBe(
      '',
    );
  });

  it('T-EDI-006 pull が途中で失敗したら対象名を付けて throw し、後続を pull しない', async () => {
    const pulls: string[] = [];
    const client: DockerImageClient = {
      listImages: async () => [],
      pull: async (image) => {
        pulls.push(image);
        if (image === MYSQL_IMAGE) throw new Error('registry unavailable');
      },
    };

    await expect(
      ensureLiveImages(client, { notify: () => undefined, resolveReaper: async () => RYUK }),
    ).rejects.toThrow(
      `Docker image の pull に失敗しました: ${MYSQL_IMAGE}: registry unavailable`,
    );
    expect(pulls, '失敗後の reaper pull へ進まない').toEqual([POSTGRES_IMAGE, MYSQL_IMAGE]);
  });

  it('T-EDI-007 pull の完了を待ってから結果を返す', async () => {
    let finishPull: (() => void) | undefined;
    let markPullStarted: (() => void) | undefined;
    const pullFinished = new Promise<void>((resolve) => {
      finishPull = resolve;
    });
    const pullStarted = new Promise<void>((resolve) => {
      markPullStarted = resolve;
    });
    let settled = false;
    const resultPromise = ensureLiveImages(
      {
        listImages: async () => [{ RepoTags: [RYUK] }],
        pull: async () => {
          markPullStarted?.();
          return pullFinished;
        },
      },
      {
        dbImages: [POSTGRES_IMAGE],
        notify: () => undefined,
        resolveReaper: async () => RYUK,
      },
    ).then((result) => {
      settled = true;
      return result;
    });

    await pullStarted;
    await Promise.resolve();
    expect(settled, 'pull stream の完了前に helper が返った').toBe(false);
    finishPull?.();
    await expect(resultPromise).resolves.toMatchObject({ pulled: [POSTGRES_IMAGE] });
  });
});
