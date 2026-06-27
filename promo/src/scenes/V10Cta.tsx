import { useCurrentFrame, interpolate, spring, useVideoConfig, AbsoluteFill } from "remotion";
import { Caret } from "../components/Caret";
import { tokens, t } from "../tokens";

const typeWriter = (text: string, frame: number, start: number, cps = 3.4) => {
  const chars = Math.max(0, Math.floor((frame - start) * cps));
  return text.slice(0, chars);
};

export const V10Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowEnter = spring({
    frame: frame - 4,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 18,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const eyebrowOpacity = interpolate(eyebrowEnter, [0, 1], [0, 1]);

  const boxEnter = spring({
    frame: frame - 12,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
    config: { damping: 14, mass: 0.8, stiffness: 110 },
  });
  const boxOpacity = interpolate(boxEnter, [0, 1], [0, 1]);
  const boxY = interpolate(boxEnter, [0, 1], [20, 0]);
  const boxScale = interpolate(boxEnter, [0, 1], [0.95, 1]);

  const cmdText = t().v10CtaCmd;
  const cmdTyped = typeWriter(cmdText, frame, 30, 3.4);
  const cmdActive = cmdTyped.length > 0 && cmdTyped.length < cmdText.length;

  const repoEnter = spring({
    frame: frame - 75,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 18,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const repoOpacity = interpolate(repoEnter, [0, 1], [0, 1]);
  const repoY = interpolate(repoEnter, [0, 1], [10, 0]);

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
          {t().v10CtaEyebrow}
        </div>
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxY}px) scale(${boxScale})`,
            padding: "28px 48px",
            border: `2px solid ${tokens.color.primary}`,
            borderRadius: 14,
            background: `${tokens.color.primary}10`,
            fontFamily: tokens.font.mono,
            fontSize: 48,
            fontWeight: 600,
            color: tokens.color.primary,
            letterSpacing: 1,
            whiteSpace: "pre",
            minHeight: 86,
            display: "flex",
            alignItems: "center",
          }}
        >
          {cmdTyped}
          {cmdActive && <Caret height={46} width={16} />}
        </div>
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 26,
            fontWeight: 500,
            color: tokens.color.textMuted,
            letterSpacing: 1.5,
            opacity: repoOpacity,
            transform: `translateY(${repoY}px)`,
          }}
        >
          {t().v10CtaRepo}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
