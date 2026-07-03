/**
 * Multimodal input primitives — image + audio を 4 SDK adapter で統一 mock する
 * ための共通型・helper。
 *
 * v1.15-1 milestone (Issue #746) で新設。 v0.1 の text-only `ChatMessage` に
 * 対して、 `ChatMessage.parts?: MessagePart[]` を optional に追加することで
 * 後方互換を保ちつつ image / audio を扱えるようにする。
 *
 * ### なぜ parts を optional にしたか
 *
 * `content: string` は 4 SDK 全部で「1 turn の text」 として意味を持つ最小
 * 契約であり、 v0.1 で既に大量の test が書かれている。 その表面を壊さず
 * multimodal を差し込むため、 `parts` を optional 上位表現として追加した。
 * adapter は `parts` があればそれを SDK 固有の image/audio shape に変換、
 * なければ従来通り `content` を使う。
 *
 * ### token estimation
 *
 * 実 provider は image を「解像度依存の image token 数」 で課金する
 * (Anthropic は 1024x1024 で ~1600 token、 OpenAI vision は 1105 token
 * detail=high 等)。 kiwa mock は「1 image = fixed token cost」 の近似で十分。
 * v0.2 default = image 1 個で `imageTokenCost` (default 1500)、 audio 1 個で
 * `audioTokenCost` (default 500)。 real fidelity と ±20% 以内に収まる目安。
 *
 * ### Whisper transcription mock
 *
 * OpenAI Whisper は audio → text 単方向 transcription。 chat completions とは
 * 別 endpoint (`audio.transcriptions.create`) だが、 mock では
 * `MockConfig.transcriptions` dict に「audio id → 期待 text」 を登録して、
 * OpenAI adapter の `audio.transcriptions.create` mock が dict lookup で返す。
 */

/** base64 data + media type、 real API と shape 整合。 */
export interface Base64Data {
  kind: 'base64';
  /** MIME type (`image/jpeg` / `image/png` / `image/webp` / `audio/wav` / `audio/mpeg` 等)。 */
  mediaType: string;
  /** base64 encoded payload (data URI prefix なし)。 */
  data: string;
}

/** URL 参照、 4 SDK 全部で fetch 経路がある。 */
export interface UrlData {
  kind: 'url';
  url: string;
}

/** Image / Audio の source 表現統一。 */
export type MediaSource = Base64Data | UrlData;

/** text-only 分岐 (parts 混在時の従来 text 表現)。 */
export interface TextPart {
  type: 'text';
  text: string;
}

/** Image 入力。 detail は OpenAI vision の resolution hint と互換。 */
export interface ImagePart {
  type: 'image';
  source: MediaSource;
  /** OpenAI vision detail hint (default 'auto')。 mock は token 計算に反映。 */
  detail?: 'low' | 'high' | 'auto';
}

/** Audio 入力 (Whisper transcription や OpenAI audio input で使用)。 */
export interface AudioPart {
  type: 'audio';
  source: MediaSource;
  /** 音声 duration の秒数 hint (mock token 計算に使用、 未指定は 10s と仮定)。 */
  durationSeconds?: number;
  /**
   * `chat` = OpenAI Chat Completions の `input_audio` (音声を chat context に
   * 差し込む) / `transcription` = Whisper 単発 transcription 用。
   * default `chat`。
   */
  purpose?: 'chat' | 'transcription';
}

/** MessagePart union — chat message の 1 sub-block。 */
export type MessagePart = TextPart | ImagePart | AudioPart;

/**
 * 1 audio 入力に対する transcription 期待値。 `MockConfig.transcriptions` の
 * dict value 型。 audio id は Base64 source なら `base64:{hash}` / URL source
 * なら `url:{url}` を lookup key とする。
 */
export interface MockTranscription {
  /** 転写結果 text。 */
  text: string;
  /** 認識言語 (ISO-639-1、 未指定 = 'en')。 */
  language?: string;
  /** verbose_json mode 用 segments (mock は 1 segment fallback)。 */
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

/** Whisper 1 回分の transcription 結果 (real API shape 互換)。 */
export interface TranscriptionResult {
  text: string;
  language: string;
  durationSeconds: number;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
  /** kiwa 拡張 — mock 実測 cost / latency。 */
  _kiwa: {
    costUsd: number;
    latencyMs: number;
  };
}

/** `parts` に image / audio が 1 件でも含まれるか。 */
export function hasMultimodalParts(parts: MessagePart[] | undefined): boolean {
  if (!parts) return false;
  return parts.some((p) => p.type === 'image' || p.type === 'audio');
}

/** parts から text 部分だけを結合 (adapter が下位 engine に渡す用)。 */
export function extractTextFromParts(parts: MessagePart[]): string {
  return parts
    .filter((p): p is TextPart => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

/**
 * parts に含まれる image / audio の token 換算量を返す。 token 見積の内訳は
 * `imageTokenCost` (default 1500) × image 数 + `audioTokenCost` (default 500)
 * × audio 数 (durationSeconds > 30 の場合は比例増分)。
 *
 * detail hint は OpenAI vision の課金モデルに寄せて low = 1/2、 high = 実額、
 * auto = 実額の 0.8 を掛ける。
 */
export function estimateMultimodalTokens(
  parts: MessagePart[] | undefined,
  config: { imageTokenCost?: number; audioTokenCost?: number } = {},
): number {
  if (!parts) return 0;
  const imageCost = config.imageTokenCost ?? 1500;
  const audioCost = config.audioTokenCost ?? 500;
  let total = 0;
  for (const p of parts) {
    if (p.type === 'image') {
      const detailFactor = p.detail === 'low' ? 0.5 : p.detail === 'high' ? 1 : 0.8;
      total += Math.floor(imageCost * detailFactor);
    } else if (p.type === 'audio') {
      const duration = p.durationSeconds ?? 10;
      const scale = duration <= 30 ? 1 : duration / 30;
      total += Math.floor(audioCost * scale);
    }
  }
  return total;
}

/**
 * audio part を transcription key に変換 (mock dict lookup 用)。 base64 は
 * `base64:{先頭 32 文字}`、 url は `url:{url}` を使う。 先頭 32 文字 hash は
 * 「同じ audio を渡せば同じ key」 を担保する軽量 fingerprint。
 */
export function toTranscriptionKey(source: MediaSource): string {
  if (source.kind === 'url') return `url:${source.url}`;
  return `base64:${source.data.slice(0, 32)}`;
}

/**
 * 「image 1 件以上を含む parts」 の shape guard。 adapter の分岐用。
 */
export function hasImagePart(parts: MessagePart[] | undefined): boolean {
  if (!parts) return false;
  return parts.some((p) => p.type === 'image');
}

/** 「audio 1 件以上を含む parts」 の shape guard。 */
export function hasAudioPart(parts: MessagePart[] | undefined): boolean {
  if (!parts) return false;
  return parts.some((p) => p.type === 'audio');
}
