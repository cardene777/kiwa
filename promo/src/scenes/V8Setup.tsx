import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Caret } from "../components/Caret";
import { tokens, t } from "../tokens";

const typeWriter = (text: string, frame: number, start: number, cps = 2.4) => {
  const chars = Math.max(0, Math.floor((frame - start) * cps));
  return text.slice(0, chars);
};

type Line = {
  prompt?: string;
  text: string;
  start: number;
  color?: string;
  cps?: number;
};

export const V8Setup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowEnter = spring({
    frame: frame - 6,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const eyebrowOpacity = interpolate(eyebrowEnter, [0, 1], [0, 1]);
  const headlineEnter = spring({
    frame: frame - 18,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 26,
    config: { damping: 16, mass: 1, stiffness: 95 },
  });
  const headlineOpacity = interpolate(headlineEnter, [0, 1], [0, 1]);
  const headlineY = interpolate(headlineEnter, [0, 1], [16, 0]);

  const termEnter = spring({
    frame: frame - 40,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 26,
    config: { damping: 14, mass: 0.7, stiffness: 110 },
  });
  const termOpacity = interpolate(termEnter, [0, 1], [0, 1]);
  const termY = interpolate(termEnter, [0, 1], [24, 0]);

  const lines: Line[] = [
    { prompt: "$", text: "pnpm dlx @kiwa-test/cli init", start: 70, cps: 2.4 },
    { text: "kiwa: creating spec workspace…", start: 132, color: tokens.color.textMuted, cps: 3.0 },
    { text: "kiwa: 11 packages linked", start: 154, color: tokens.color.textMuted, cps: 3.5 },
    { text: "✓ ready in 2.1s", start: 178, color: tokens.color.primary, cps: 3.0 },
  ];

  const activeLine = (() => {
    let active = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fullText = line.prompt ? `${line.prompt} ${line.text}` : line.text;
      const charsTyped = Math.max(0, Math.floor((frame - line.start) * (line.cps ?? 2.4)));
      if (charsTyped > 0 && charsTyped < fullText.length) {
        active = i;
        break;
      }
      if (charsTyped >= fullText.length) active = i;
    }
    return active;
  })();

  return (
    <AbsoluteFill
      style={{
        background: tokens.color.bg,
        fontFamily: tokens.font.sans,
        color: tokens.color.white,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 100,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 60,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 26,
              fontWeight: 500,
              color: tokens.color.primary,
              letterSpacing: 6,
              textTransform: "uppercase",
              opacity: eyebrowOpacity,
            }}
          >
            {t().v8SetupEyebrow}
          </div>
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 72,
              fontWeight: 700,
              color: tokens.color.white,
              letterSpacing: -1.5,
              opacity: headlineOpacity,
              transform: `translateY(${headlineY}px)`,
            }}
          >
            {t().v8SetupHeadline}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: termOpacity,
            transform: `translateY(${termY}px)`,
          }}
        >
          <div
            style={{
              width: 1280,
              borderRadius: 14,
              overflow: "hidden",
              background: "#0B0F18",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
              border: `1px solid ${tokens.color.primary}33`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 22px",
                background: "#161B26",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FF5F57" }} />
                <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FEBC2E" }} />
                <div style={{ width: 14, height: 14, borderRadius: 7, background: "#28C840" }} />
              </div>
              <div style={{ flex: 1, textAlign: "center", color: tokens.color.textMuted, fontFamily: tokens.font.mono, fontSize: 18 }}>
                ~/kiwa-project — zsh
              </div>
            </div>
            <div
              style={{
                padding: "44px 48px",
                fontFamily: tokens.font.mono,
                fontSize: 30,
                lineHeight: 1.7,
                minHeight: 360,
              }}
            >
              {lines.map((line, idx) => {
                const fullText = line.prompt ? `${line.prompt} ${line.text}` : line.text;
                const typed = typeWriter(fullText, frame, line.start, line.cps ?? 2.4);
                if (typed.length === 0) return null;
                const isComplete = typed.length >= fullText.length;
                const isActive = idx === activeLine && !isComplete;
                let promptPart = "";
                let rest = typed;
                if (line.prompt && typed.startsWith(line.prompt)) {
                  promptPart = typed.slice(0, line.prompt.length);
                  rest = typed.slice(line.prompt.length);
                }
                return (
                  <div
                    key={idx}
                    style={{
                      color: line.color ?? tokens.color.white,
                      fontWeight: 500,
                      whiteSpace: "pre",
                      minHeight: 50,
                    }}
                  >
                    {promptPart && (
                      <span style={{ color: tokens.color.primary, fontWeight: 700 }}>
                        {promptPart}
                      </span>
                    )}
                    <span>{rest}</span>
                    {isActive && <Caret />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
