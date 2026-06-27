import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { KiwaLogo } from "../components/KiwaLogo";
import { MaskRevealText } from "../components/MaskRevealText";
import { tokens, t } from "../tokens";

export const V9BrandIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameEnter = spring({
    frame: frame - 8,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 18,
    config: { damping: 16, mass: 1, stiffness: 110 },
  });
  const nameOpacity = interpolate(nameEnter, [0, 1], [0, 1]);
  const nameX = interpolate(nameEnter, [0, 1], [-12, 0]);

  const exitOpacity = interpolate(frame, [50, 60], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: tokens.color.bg,
        fontFamily: tokens.font.sans,
        opacity: exitOpacity,
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
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <KiwaLogo size={120} fadeInDuration={14} scaleFrom={0.6} />
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontWeight: 800,
              fontSize: 120,
              color: tokens.color.white,
              letterSpacing: -3,
              opacity: nameOpacity,
              transform: `translateX(${nameX}px)`,
              lineHeight: 1,
            }}
          >
            {t().v9BrandName}
          </div>
        </div>
        <MaskRevealText
          text={t().v9BrandTagline}
          startFrame={24}
          fontSize={32}
          fontWeight={500}
          color={tokens.color.textMuted}
          letterSpacing={1.5}
          fontFamily={tokens.font.mono}
          align="center"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
