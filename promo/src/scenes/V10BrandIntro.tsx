import { useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { Background } from "../components/Background";
import { KiwaLogo } from "../components/KiwaLogo";
import { BoundaryEffect } from "../components/BoundaryEffect";
import { tokens, t } from "../tokens";

export const V10BrandIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameEnter = spring({
    frame: frame - 6,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 18,
    config: { damping: 16, mass: 1, stiffness: 110 },
  });
  const nameOpacity = interpolate(nameEnter, [0, 1], [0, 1]);
  const nameX = interpolate(nameEnter, [0, 1], [-12, 0]);

  const taglineEnter = spring({
    frame: frame - 22,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const taglineOpacity = interpolate(taglineEnter, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineEnter, [0, 1], [12, 0]);

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
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <KiwaLogo size={180} fadeInDuration={14} scaleFrom={0.6} />
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontWeight: 800,
              fontSize: 160,
              color: tokens.color.white,
              letterSpacing: -4,
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
            fontSize: 32,
            fontWeight: 500,
            color: tokens.color.textMuted,
            letterSpacing: 2,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            textAlign: "center",
          }}
        >
          {t().v10BrandTagline}
        </div>
      </div>
      <Sequence from={60}>
        <BoundaryEffect startFrame={0} duration={40} />
      </Sequence>
    </Background>
  );
};
