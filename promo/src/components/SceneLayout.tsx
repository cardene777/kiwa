import { AbsoluteFill } from "remotion";
import { tokens } from "../tokens";

type Props = {
  eyebrow?: string;
  headline?: string;
  children: React.ReactNode;
};

export const SceneLayout: React.FC<Props> = ({ eyebrow, headline, children }) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${tokens.color.bg} 0%, ${tokens.color.bgGradientEnd} 100%)`,
        fontFamily: tokens.font.sans,
        color: tokens.color.white,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 80,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {(eyebrow || headline) && (
          <div
            style={{
              height: 180,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: tokens.spacing.sm,
            }}
          >
            {eyebrow && (
              <div
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: 26,
                  fontWeight: 500,
                  color: tokens.color.primary,
                  letterSpacing: 5,
                  textTransform: "uppercase",
                }}
              >
                {eyebrow}
              </div>
            )}
            {headline && (
              <div
                style={{
                  fontFamily: tokens.font.sans,
                  fontSize: 64,
                  fontWeight: 700,
                  color: tokens.color.white,
                  letterSpacing: -1.5,
                  lineHeight: 1.15,
                }}
              >
                {headline}
              </div>
            )}
          </div>
        )}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
