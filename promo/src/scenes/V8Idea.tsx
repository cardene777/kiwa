import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { MaskRevealText } from "../components/MaskRevealText";
import { tokens, t } from "../tokens";

export const V8Idea: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const subEnter = spring({
    frame: frame - 90,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 28,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const subOpacity = interpolate(subEnter, [0, 1], [0, 1]);
  const subY = interpolate(subEnter, [0, 1], [16, 0]);

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
          gap: 8,
        }}
      >
        <MaskRevealText
          text={t().v8IdeaLine1}
          startFrame={8}
          fontSize={156}
          fontWeight={700}
          color={tokens.color.primary}
          letterSpacing={-5}
          align="center"
        />
        <MaskRevealText
          text={t().v8IdeaLine2}
          startFrame={42}
          fontSize={156}
          fontWeight={700}
          color={tokens.color.white}
          letterSpacing={-5}
          align="center"
        />
        <div
          style={{
            marginTop: 56,
            fontFamily: tokens.font.mono,
            fontSize: 28,
            fontWeight: 500,
            color: tokens.color.textMuted,
            letterSpacing: 3,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          {t().v8IdeaSub}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
