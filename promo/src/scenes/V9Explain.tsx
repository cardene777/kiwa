import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { MaskRevealText } from "../components/MaskRevealText";
import { tokens, t } from "../tokens";

export const V9Explain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const subEnter = spring({
    frame: frame - 80,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
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
          paddingLeft: 120,
          paddingRight: 120,
          gap: 32,
        }}
      >
        <MaskRevealText
          text={t().v9ExplainHeadline}
          startFrame={10}
          fontSize={tokens.locale === "ja" ? 64 : 72}
          fontWeight={700}
          color={tokens.color.white}
          letterSpacing={-1.5}
          align="center"
          lineHeight={1.2}
        />
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 30,
            fontWeight: 500,
            color: tokens.color.primary,
            letterSpacing: 3,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            textAlign: "center",
          }}
        >
          {t().v9ExplainSub}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
