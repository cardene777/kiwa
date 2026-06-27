import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Caret } from "../components/Caret";
import { tokens, t } from "../tokens";

const typeWriter = (text: string, frame: number, start: number, cps = 2.4) => {
  const chars = Math.max(0, Math.floor((frame - start) * cps));
  return text.slice(0, chars);
};

type ParallelTerm = {
  title: string;
  cmd: string;
  log: string;
  pass: string;
  start: number;
  passStart: number;
};

export const V8Generate: React.FC = () => {
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

  const aiEnter = spring({
    frame: frame - 40,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
    config: { damping: 14, mass: 0.7, stiffness: 110 },
  });
  const aiOpacity = interpolate(aiEnter, [0, 1], [0, 1]);
  const aiY = interpolate(aiEnter, [0, 1], [20, 0]);

  const cmdText = "claude /kiwa-design tokenGating";
  const cmdTyped = typeWriter(cmdText, frame, 50, 2.5);
  const cmdActive = cmdTyped.length > 0 && cmdTyped.length < cmdText.length;
  const aiReplyText = t().v8GenerateAi;
  const aiReplyStart = 130;
  const aiReplyTyped = typeWriter(aiReplyText, frame, aiReplyStart, 2.6);

  const terminals: ParallelTerm[] = [
    {
      title: "/kiwa-forge → forge test",
      cmd: "$ forge test --match-contract TokenGate",
      log: "Compiling 12 files…",
      pass: "✓ 9 passed (1.2s)",
      start: 200,
      passStart: 296,
    },
    {
      title: "/kiwa-vitest → vitest run",
      cmd: "$ vitest run src/tokenGating",
      log: "RUN  src/tokenGating.test.ts",
      pass: "✓ 14 passed (0.8s)",
      start: 215,
      passStart: 304,
    },
    {
      title: "/kiwa-play → playwright test",
      cmd: "$ playwright test tokenGating.e2e",
      log: "Running 4 tests using 4 workers",
      pass: "✓ 4 passed (2.1s)",
      start: 230,
      passStart: 312,
    },
  ];

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
          padding: 80,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            {t().v8GenerateEyebrow}
          </div>
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 56,
              fontWeight: 700,
              color: tokens.color.white,
              letterSpacing: -1,
              opacity: headlineOpacity,
              transform: `translateY(${headlineY}px)`,
            }}
          >
            {t().v8GenerateHeadline}
          </div>
        </div>

        <div
          style={{
            background: "#0B0F18",
            borderRadius: 12,
            padding: "28px 36px",
            border: `1px solid ${tokens.color.primary}33`,
            opacity: aiOpacity,
            transform: `translateY(${aiY}px)`,
            fontFamily: tokens.font.mono,
            fontSize: 26,
            lineHeight: 1.6,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ whiteSpace: "pre", minHeight: 42 }}>
            <span style={{ color: tokens.color.primary, fontWeight: 700 }}>$ </span>
            <span style={{ color: tokens.color.white }}>{cmdTyped}</span>
            {cmdActive && <Caret />}
          </div>
          {aiReplyTyped.length > 0 && (
            <div
              style={{
                whiteSpace: "pre-wrap",
                color: tokens.color.textMuted,
                paddingLeft: 4,
              }}
            >
              {aiReplyTyped}
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            minHeight: 0,
          }}
        >
          {terminals.map((term, idx) => {
            const enter = spring({
              frame: frame - term.start,
              fps,
              from: 0,
              to: 1,
              durationInFrames: 22,
              config: { damping: 14, mass: 0.7, stiffness: 110 },
            });
            const cardOpacity = interpolate(enter, [0, 1], [0, 1]);
            const cardY = interpolate(enter, [0, 1], [20, 0]);

            const cmdT = typeWriter(term.cmd, frame, term.start + 6, 2.8);
            const cmdA = cmdT.length > 0 && cmdT.length < term.cmd.length;
            const logT = typeWriter(term.log, frame, term.start + 36, 3.0);
            const logA = logT.length > 0 && logT.length < term.log.length;
            const passEnter = spring({
              frame: frame - term.passStart,
              fps,
              from: 0,
              to: 1,
              durationInFrames: 18,
              config: { damping: 14, mass: 0.6, stiffness: 120 },
            });
            const passOpacity = interpolate(passEnter, [0, 1], [0, 1]);
            const passY = interpolate(passEnter, [0, 1], [8, 0]);

            return (
              <div
                key={idx}
                style={{
                  background: "#0B0F18",
                  borderRadius: 12,
                  padding: "22px 26px",
                  border: `1px solid ${tokens.color.primary}33`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  opacity: cardOpacity,
                  transform: `translateY(${cardY}px)`,
                  fontFamily: tokens.font.mono,
                  fontSize: 18,
                  lineHeight: 1.55,
                }}
              >
                <div
                  style={{
                    color: tokens.color.primary,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {term.title}
                </div>
                <div style={{ color: tokens.color.white, whiteSpace: "pre", minHeight: 30 }}>
                  {cmdT}
                  {cmdA && <Caret height={20} width={10} />}
                </div>
                {logT.length > 0 && (
                  <div style={{ color: tokens.color.textMuted, whiteSpace: "pre", minHeight: 30 }}>
                    {logT}
                    {logA && <Caret height={20} width={10} color={tokens.color.textMuted} />}
                  </div>
                )}
                <div
                  style={{
                    marginTop: "auto",
                    color: tokens.color.primary,
                    fontWeight: 700,
                    opacity: passOpacity,
                    transform: `translateY(${passY}px)`,
                  }}
                >
                  {term.pass}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
