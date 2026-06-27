import { useCurrentFrame, useVideoConfig } from "remotion";

type AmbientOptions = {
  /** Number of seconds the breath / drift cycle takes (default 4s). */
  cyclesSec?: number;
  /**
   * Scale delta around 1.0 (default 0.04 = ±4%).
   * Per motion-anti-patterns.md § 1: values below 0.02 are NOT noticed by
   * human viewers on a 1080p video. 0.04 is the minimum to register as
   * "breathing". Cap at 0.05 (motion-anti-patterns.md § 6).
   */
  scaleAmplitude?: number;
  /** Vertical drift in pixels (default 10px). 4px range is invisible. */
  driftYAmplitude?: number;
  /** Horizontal drift in pixels (default 6px). */
  driftXAmplitude?: number;
  /**
   * Per-element phase offset in frames (default 0).
   * Use `phase: index * 12` so adjacent items don't breathe in sync
   * (motion-anti-patterns.md § 3).
   */
  phase?: number;
  /** Glow opacity oscillation 0..1 (default 0.30 = ±30%). */
  glowAmplitude?: number;
};

export type AmbientMotionState = {
  /** Multiply into transform: scale(state.scale) */
  scale: number;
  /** Add into transform: translate(state.driftX, state.driftY) */
  driftX: number;
  driftY: number;
  /** Multiply box-shadow alpha or drop-shadow strength by this (1 ± glow) */
  glow: number;
  /** 0..1 cosine wave for custom use */
  pulse: number;
};

/**
 * Returns a tiny breathing motion (scale ± 1.2%, drift ±4px, glow ±0.15)
 * that keeps every element subtly alive even when no entrance animation is
 * playing. Use to defeat the "everything stopped after 1s" feeling.
 *
 * Recommended pattern:
 *   const a = useAmbientMotion({ phase: index * 12 });
 *   <div style={{ transform: `translate(${a.driftX}px, ${a.driftY}px) scale(${a.scale})` }} />
 *
 * Per-element `phase` keeps adjacent tiles from breathing in sync (= less
 * mechanical, more organic).
 */
export const useAmbientMotion = (options: AmbientOptions = {}): AmbientMotionState => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const {
    cyclesSec = 4,
    scaleAmplitude = 0.04,
    driftYAmplitude = 10,
    driftXAmplitude = 6,
    phase = 0,
    glowAmplitude = 0.30,
  } = options;

  const cycleFrames = cyclesSec * fps;
  const t = ((frame + phase) % cycleFrames) / cycleFrames;
  const wave = Math.sin(t * Math.PI * 2);
  const cos = Math.cos(t * Math.PI * 2);

  return {
    scale: 1 + wave * scaleAmplitude,
    driftX: cos * driftXAmplitude,
    driftY: wave * driftYAmplitude,
    glow: 1 + wave * glowAmplitude,
    pulse: 0.5 + 0.5 * wave,
  };
};
