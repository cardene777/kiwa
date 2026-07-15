import type { MacAppEnv } from './env.js';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreencapOptions {
  region?: Rect;
  format?: 'png' | 'jpeg';
  scale?: number;
}

export interface ScreencapResult {
  format: 'png' | 'jpeg';
  region: Rect;
  bytes: Uint8Array;
  capturedAt: number;
  bytesLength: number;
}

/** PNG signature (8 bytes) — 実 CGDisplayCreateImage で PNG encode した時と同じ magic。 */
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** JPEG SOI marker (2 bytes) — 実 CGDisplay + JPEG encode 時の magic。 */
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8]);

/**
 * CGDisplayCreateImage 相当の mock screencap を生成。 実 GPU capture ではなく、
 * region + 決定的 pixel data (env.id + region ハッシュ) から magic 付きの mock byte 列を
 * 返す。 caller は format magic + length + region 契約を assert 可能。
 */
export function mockScreencap(env: MacAppEnv, options: ScreencapOptions = {}): ScreencapResult {
  const format = options.format ?? 'png';
  const region: Rect = options.region ?? {
    x: 0,
    y: 0,
    width: env.window.width,
    height: env.window.height,
  };
  const scale = options.scale ?? 1;
  const pixelCount = Math.max(1, Math.floor(region.width * region.height * scale * scale));
  // deterministic mock body = magic + [region hash % 256] * 16 + pixelCount lo byte fill (up to 128 bytes)
  const magic = format === 'png' ? PNG_MAGIC : JPEG_MAGIC;
  const hash = (region.x * 31 + region.y * 17 + region.width * 7 + region.height * 3) & 0xff;
  const fillLen = Math.min(128, pixelCount);
  const bytes = new Uint8Array(magic.length + 16 + fillLen);
  bytes.set(magic, 0);
  for (let i = 0; i < 16; i += 1) bytes[magic.length + i] = hash;
  for (let i = 0; i < fillLen; i += 1) bytes[magic.length + 16 + i] = i & 0xff;
  return {
    format,
    region,
    bytes,
    capturedAt: env.now(),
    bytesLength: bytes.length,
  };
}
