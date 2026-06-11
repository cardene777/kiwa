import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { KiwaLogo } from "../components/KiwaLogo";
import { BoundaryEffect } from "../components/BoundaryEffect";
import { tokens } from "../tokens";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const npmFade = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const linkFade = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaScale = spring({
    frame: frame - 40,
    fps,
    from: 0.9,
    to: 1,
    config: { damping: 14, mass: 0.8, stiffness: 110 },
  });

  return (
    <Background>
      <BoundaryEffect startFrame={0} duration={120} />
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: tokens.spacing.lg,
        }}
      >
        <KiwaLogo size={260} fadeInDuration={20} scaleFrom={0.6} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: tokens.spacing.md,
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 40,
              fontWeight: 500,
              color: tokens.color.primary,
              opacity: npmFade,
              transform: `scale(${ctaScale})`,
              padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
              border: `2px solid ${tokens.color.primary}`,
              borderRadius: 12,
              background: "rgba(124, 179, 66, 0.08)",
              boxShadow: `0 0 32px rgba(124, 179, 66, 0.3)`,
            }}
          >
            $ {tokens.text.npmUrl}
          </div>
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 22,
              fontWeight: 400,
              color: tokens.color.textMuted,
              opacity: linkFade,
              display: "flex",
              gap: tokens.spacing.md,
              alignItems: "center",
            }}
          >
            <span>{tokens.text.repoUrl}</span>
            <span style={{ color: tokens.color.primaryDark }}>·</span>
            <span>npmjs.com/package/@kiwa-test/core</span>
          </div>
        </div>
      </div>
    </Background>
  );
};
