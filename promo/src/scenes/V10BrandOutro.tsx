import { useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { Background } from "../components/Background";
import { KiwaLogo } from "../components/KiwaLogo";
import { BoundaryEffect } from "../components/BoundaryEffect";
import { tokens, t } from "../tokens";

export const V10BrandOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameEnter = spring({
    frame: frame - 4,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 16,
    config: { damping: 16, mass: 1, stiffness: 110 },
  });
  const nameOpacity = interpolate(nameEnter, [0, 1], [0, 1]);
  const nameX = interpolate(nameEnter, [0, 1], [-10, 0]);

  const taglineEnter = spring({
    frame: frame - 18,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const taglineOpacity = interpolate(taglineEnter, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineEnter, [0, 1], [10, 0]);

  return (
    <Background>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <KiwaLogo size={140} fadeInDuration={12} scaleFrom={0.7} />
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontWeight: 800,
              fontSize: 140,
              color: tokens.color.white,
              letterSpacing: -3,
              opacity: nameOpacity,
              transform: `translateX(${nameX}px)`,
              lineHeight: 1,
            }}
          >
            {t().productName}
          </div>
        </div>
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 28,
            fontWeight: 500,
            color: tokens.color.textMuted,
            letterSpacing: 2,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          {t().v10BrandTagline}
        </div>
      </div>
      <Sequence from={30}>
        <BoundaryEffect startFrame={0} duration={90} />
      </Sequence>
    </Background>
  );
};
