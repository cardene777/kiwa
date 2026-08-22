// `ensureLiveImages` の 4 経路を固定する (Issue #2159)。
//
// 実 docker は使わない。 client を注入して、揃っている / 欠けている / docker 不在 /
// reaper 名を読めない を別々に見る。 実 docker を使うと「image が cache にあるか」 が
// 実行環境で変わり、検査が環境の状態を測ることになる。
import { describe, expect, it } from 'vitest';

import {
  DB_IMAGES,
  ensureLiveImages,
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
      (message) => notices.push(message),
      async () => RYUK,
    );
    expect(pulls, 'pull を呼んだ').toEqual([]);
    expect(result.pulled).toEqual([]);
    expect(result.present.slice().sort()).toEqual([...DB_IMAGES, RYUK].slice().sort());
    expect(result.unavailable).toBeNull();
    expect(notices, '揃っている時は何も言わない').toEqual([]);
  });

  it('T-EDI-002 欠けているものだけを pull し、名前を message に出す', async () => {
    const pulls: string[] = [];
    const notices: string[] = [];
    const result = await ensureLiveImages(
      fakeClient([DB_IMAGES[0]], (image) => pulls.push(image)),
      (message) => notices.push(message),
      async () => RYUK,
    );
    expect(pulls, '欠けている 2 件だけを pull する').toEqual([DB_IMAGES[1], RYUK]);
    expect(result.present).toEqual([DB_IMAGES[0]]);
    expect(result.pulled).toEqual([DB_IMAGES[1], RYUK]);
    // 待っている相手が message から読めることが本 helper の目的。
    expect(notices[0], '最初の message に欠けている image 名が入る').toContain(DB_IMAGES[1]);
    expect(notices[0]).toContain(RYUK);
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
      (message) => notices.push(message),
      async () => RYUK,
    );
    expect(result.unavailable, 'docker 不在の理由を返す').toContain('docker.sock');
    expect(result.pulled).toEqual([]);
  });

  it('T-EDI-004 reaper 名を読めない時は残りだけ先読みする', async () => {
    const pulls: string[] = [];
    const notices: string[] = [];
    const result = await ensureLiveImages(
      fakeClient([], (image) => pulls.push(image)),
      (message) => notices.push(message),
      async () => null,
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
    expect(image, 'REAPER_IMAGE を読めない (読めない場合 T-EDI-004 の経路へ落ちる)').toMatch(
      /^\S+\/ryuk:\S+$/,
    );
  });
});
