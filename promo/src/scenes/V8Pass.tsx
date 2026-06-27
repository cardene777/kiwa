import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { tokens, t } from "../tokens";

export const V8Pass: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowEnter = spring({
    frame: frame - 4,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 18,
    config: { damping: 16, mass: 1, stiffness: 110 },
  });
  const eyebrowOpacity = interpolate(eyebrowEnter, [0, 1], [0, 1]);

  const headlineEnter = spring({
    frame: frame - 14,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
    config: { damping: 16, mass: 1, stiffness: 95 },
  });
  const headlineOpacity = interpolate(headlineEnter, [0, 1], [0, 1]);
  const headlineY = interpolate(headlineEnter, [0, 1], [22, 0]);

  const ctaEnter = spring({
    frame: frame - 50,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const ctaOpacity = interpolate(ctaEnter, [0, 1], [0, 1]);
  const ctaY = interpolate(ctaEnter, [0, 1], [16, 0]);

  const repoEnter = spring({
    frame: frame - 78,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const repoOpacity = interpolate(repoEnter, [0, 1], [0, 1]);
  const repoY = interpolate(repoEnter, [0, 1], [12, 0]);

  return (
    <AbsoluteFill
      style={{
        background: tokens.color.bg,
        fontFamily: tokens.font.sans,
        color: tokens.color.white,
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 28,
          paddingLeft: 100,
          paddingRight: 100,
        }}
      >
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 28,
            fontWeight: 500,
            color: tokens.color.primary,
            letterSpacing: 10,
            textTransform: "uppercase",
            opacity: eyebrowOpacity,
          }}
        >
          {t().v8PassEyebrow}
        </div>
        <div
          style={{
            fontFamily: tokens.font.sans,
            fontSize: 84,
            fontWeight: 700,
            color: tokens.color.white,
            letterSpacing: -2.5,
            textAlign: "center",
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
            lineHeight: 1.18,
            whiteSpace: "pre-line",
          }}
        >
          {t().v8PassHeadline}
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: tokens.font.mono,
            fontSize: 38,
            fontWeight: 600,
            color: tokens.color.primary,
            letterSpacing: 1,
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            padding: "16px 32px",
            border: `2px solid ${tokens.color.primary}`,
            borderRadius: 12,
            background: `${tokens.color.primary}10`,
          }}
        >
          {t().v8PassCta}
        </div>
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 24,
            fontWeight: 500,
            color: tokens.color.textMuted,
            letterSpacing: 1.5,
            opacity: repoOpacity,
            transform: `translateY(${repoY}px)`,
          }}
        >
          {t().v8PassRepo}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
