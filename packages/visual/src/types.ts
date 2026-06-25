export interface PixelSize {
  width: number;
  height: number;
}

export interface CompareResult {
  size: PixelSize;
  diffPixels: number;
  diffRatio: number;
  ok: boolean;
  diffBuffer: Buffer | null;
}

export interface CompareOptions {
  /** Maximum mismatched pixel ratio allowed (0-1, default 0.005 = 0.5%) */
  maxDiffRatio?: number;
  /** Pixelmatch threshold (default 0.1) */
  threshold?: number;
  /** Whether to populate the diff PNG buffer (default true) */
  emitDiff?: boolean;
  /** Antialiasing tolerance (default false) */
  includeAA?: boolean;
}
