import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { KiwaLogo } from "../components/KiwaLogo";
import { MaskRevealText } from "../components/MaskRevealText";
import { tokens, t } from "../tokens";

export const V9BrandOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameEnter = spring({
    frame: frame - 6,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 16,
    config: { damping: 16, mass: 1, stiffness: 110 },
  });
  const nameOpacity = interpolate(nameEnter, [0, 1], [0, 1]);
  const nameX = interpolate(nameEnter, [0, 1], [-10, 0]);

  return (
    <AbsoluteFill
      style={{
        background: tokens.color.bg,
        fontFamily: tokens.font.sans,
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <KiwaLogo size={108} fadeInDuration={12} scaleFrom={0.7} />
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontWeight: 800,
              fontSize: 108,
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
          startFrame={18}
          fontSize={30}
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
