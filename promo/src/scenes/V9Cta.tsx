import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Caret } from "../components/Caret";
import { tokens, t } from "../tokens";

const typeWriter = (text: string, frame: number, start: number, cps = 3.4) => {
  const chars = Math.max(0, Math.floor((frame - start) * cps));
  return text.slice(0, chars);
};

export const V9Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxEnter = spring({
    frame: frame - 4,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 18,
    config: { damping: 14, mass: 0.8, stiffness: 110 },
  });
  const boxOpacity = interpolate(boxEnter, [0, 1], [0, 1]);
  const boxY = interpolate(boxEnter, [0, 1], [20, 0]);
  const boxScale = interpolate(boxEnter, [0, 1], [0.95, 1]);

  const cmdText = t().v9CtaCmd;
  const cmdTyped = typeWriter(cmdText, frame, 24, 3.6);
  const cmdActive = cmdTyped.length > 0 && cmdTyped.length < cmdText.length;

  const repoEnter = spring({
    frame: frame - 70,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 18,
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
          gap: 32,
        }}
      >
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxY}px) scale(${boxScale})`,
            padding: "26px 44px",
            border: `2px solid ${tokens.color.primary}`,
            borderRadius: 14,
            background: `${tokens.color.primary}10`,
            fontFamily: tokens.font.mono,
            fontSize: 44,
            fontWeight: 600,
            color: tokens.color.primary,
            letterSpacing: 1,
            whiteSpace: "pre",
            minHeight: 80,
            display: "flex",
            alignItems: "center",
          }}
        >
          {cmdTyped}
          {cmdActive && <Caret height={42} width={14} />}
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
          {t().v9CtaRepo}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
