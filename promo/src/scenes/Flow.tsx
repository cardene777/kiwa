import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { ChapterIndicator } from "../components/ChapterIndicator";
import { useAmbientMotion } from "../components/useAmbientMotion";
import { tokens, t } from "../tokens";

// Screencast-style Flow scene (18s):
//   Step 1 (0-180f / 6s)   ... user types a /kiwa-design invocation,
//                              SpecCard reveals one markdown line at a time.
//   Step 2 (180-360f / 6s) ... 5 terminals start, each typing its own
//                              `/kiwa-* → tool cmd` invocation.
//   Step 3 (360-540f / 6s) ... PASS lines (✓ 47 tests passed) appear with
//                              a faint glow per terminal.
//
// Ambient motion keeps elements breathing between transitions so the video
// never goes "static". See ../components/useAmbientMotion.ts.

const STEP1_END = 180;
const STEP2_START = 180;
const STEP3_START = 360;

const SPEC_LINES = [
  "# tests/spec/test-spec-tokenGating.md",
  "",
  "| TC ID | mode | observation | boundary | P |",
  "|-------|------|-------------|----------|---|",
  "| T-001 | render | balance == 1 | 0 / 1 / max | P0 |",
  "| T-002 | interaction | mint click | gas budget | P0 |",
  "| T-003 | snapshot | gated DOM | logged-in / out | P1 |",
  "",
  "✓ 9 columns × 47 rows generated",
];

type Term = {
  invocation: string;
  cmd: string;
  outLines: string[];
  color: string;
  invokeStart: number;
  cmdStart: number;
  outStart: number;
};

const terminals: Term[] = [
  {
    invocation: "/kiwa-forge --spec tokenGating",
    cmd: "$ forge test --gas-report",
    outLines: [
      "[PASS] testMintHappyPath() (gas: 84218)",
      "[PASS] testMintOnlyOwner() (gas: 30142)",
      "[PASS] testTransferFrom() (gas: 56012)",
      "Ran 47 tests · 47 passed",
    ],
    color: tokens.color.accentContract,
    invokeStart: STEP2_START,
    cmdStart: STEP2_START + 60,
    outStart: STEP3_START,
  },
  {
    invocation: "/kiwa-hardhat --spec tokenGating",
    cmd: "$ npx hardhat test",
    outLines: [
      "  TokenGating",
      "    ✓ should mint to owner (412ms)",
      "    ✓ should revert non-owner",
      "32 passing · 0 failing",
    ],
    color: tokens.color.accentContract,
    invokeStart: STEP2_START + 12,
    cmdStart: STEP2_START + 72,
    outStart: STEP3_START + 12,
  },
  {
    invocation: "/kiwa-vitest --spec tokenGating.ui",
    cmd: "$ vitest run",
    outLines: [
      "✓ src/Counter.test.tsx (12 tests) 240ms",
      "✓ src/Gated.test.tsx (8 tests) 130ms",
      "Test Files  4 passed (4)",
      "Tests  86 passed (86)",
    ],
    color: tokens.color.accentApi,
    invokeStart: STEP2_START + 24,
    cmdStart: STEP2_START + 84,
    outStart: STEP3_START + 24,
  },
  {
    invocation: "/kiwa-play --spec tokenGating.e2e",
    cmd: "$ playwright test",
    outLines: [
      "Running 23 tests using 4 workers",
      "  23 passed (4.7s)",
      "  round 1/4 zero flake",
      "  ALL 4 rounds zero flake",
    ],
    color: tokens.color.accentE2e,
    invokeStart: STEP2_START + 36,
    cmdStart: STEP2_START + 96,
    outStart: STEP3_START + 36,
  },
  {
    invocation: "kiwa-test-py --spec tokenGating",
    cmd: "$ pytest tests/",
    outLines: [
      "test_mint.py ........ [ 57%]",
      "test_gated.py ..... [100%]",
      "==== 14 passed in 1.2s ====",
      "",
    ],
    color: tokens.color.accentPy,
    invokeStart: STEP2_START + 48,
    cmdStart: STEP2_START + 108,
    outStart: STEP3_START + 48,
  },
];

/**
 * Reveals `text` one character at a time at `frame` (relative).
 * `charsPerFrame = 2` means roughly 60 chars/second at 30fps.
 */
const typeWriter = (
  text: string,
  frame: number,
  startFrame: number,
  charsPerFrame = 2,
): string => {
  const local = frame - startFrame;
  if (local <= 0) return "";
  const max = Math.min(text.length, Math.floor(local * charsPerFrame));
  return text.slice(0, max);
};

const Caret: React.FC<{ color?: string }> = ({ color = tokens.color.primary }) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.3;
  return (
    <span
      style={{
        display: "inline-block",
        width: 11,
        height: 22,
        marginLeft: 2,
        marginBottom: -3,
        background: color,
        opacity: blink,
        verticalAlign: "middle",
      }}
    />
  );
};

const SpecCard: React.FC = () => {
  const frame = useCurrentFrame();
  const ambient = useAmbientMotion({ scaleAmplitude: 0.006, driftYAmplitude: 3 });

  const enter = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = enter;
  const translateY = (1 - enter) * 12;

  // Fade out toward Step 2 end so terminals get the focus.
  const exit = interpolate(frame, [STEP2_START + 80, STEP2_START + 120], [1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const invocationText = "/kiwa-design --feature tokenGating";
  const typedInvocation = typeWriter(invocationText, frame, 4, 2);
  const invocationDone = typedInvocation.length >= invocationText.length;

  // After invocation finishes, start revealing spec lines.
  const specStart = 4 + invocationText.length / 2 + 20;

  return (
    <div
      style={{
        width: 800,
        background: tokens.color.bg,
        border: `2px solid ${tokens.color.primary}`,
        borderRadius: 14,
        padding: "20px 26px",
        boxSizing: "border-box",
        opacity: opacity * exit,
        transform: `translate(${ambient.driftX}px, ${translateY + ambient.driftY}px) scale(${ambient.scale})`,
        boxShadow: `0 0 ${28 * ambient.glow}px ${tokens.color.primary}${Math.round(0x55 * ambient.glow).toString(16).padStart(2, "0")}`,
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 17,
          lineHeight: 1.55,
          color: tokens.color.white,
          minHeight: 28,
        }}
      >
        <span style={{ color: tokens.color.textSubtle }}>$ </span>
        <span style={{ color: tokens.color.primary, fontWeight: 600 }}>{typedInvocation}</span>
        {!invocationDone && <Caret />}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: tokens.font.mono,
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {SPEC_LINES.map((line, idx) => {
          const lineStart = specStart + idx * 12;
          const typed = typeWriter(line, frame, lineStart, 3);
          const isTyping = typed.length > 0 && typed.length < line.length;
          let color: string = tokens.color.textMuted;
          let weight = 400;
          if (line.startsWith("#")) color = tokens.color.textSubtle;
          else if (line.startsWith("| TC")) {
            color = tokens.color.white;
            weight = 700;
          } else if (line.startsWith("|---")) color = `${tokens.color.primary}aa`;
          else if (line.startsWith("|")) color = tokens.color.white;
          else if (line.startsWith("✓")) {
            color = tokens.color.primary;
            weight = 700;
          }
          return (
            <div
              key={idx}
              style={{
                whiteSpace: "pre",
                color,
                fontWeight: weight,
                minHeight: line === "" ? 8 : 22,
              }}
            >
              {typed || " "}
              {isTyping && <Caret color={color} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TerminalCard: React.FC<{ term: Term; index: number; total: number }> = ({
  term,
  index,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ambient = useAmbientMotion({
    phase: index * 14,
    scaleAmplitude: 0.008,
    driftYAmplitude: 3,
  });

  const enter = spring({
    frame: frame - term.invokeStart + 8,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.7, stiffness: 100 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [18, 0]);

  // Layout: top row 3 + bottom row 2.
  const COL_W = 360;
  const COL_H = 240;
  const GAP = 24;
  const isTop = index < 3;
  const row = isTop ? 0 : 1;
  const col = isTop ? index : index - 3;
  const totalCols = isTop ? 3 : 2;
  const rowW = totalCols * COL_W + (totalCols - 1) * GAP;
  const leftOffset = -rowW / 2;
  const left = leftOffset + col * (COL_W + GAP);
  const top = row * (COL_H + GAP);

  const typedInvocation = typeWriter(term.invocation, frame, term.invokeStart, 3);
  const typedCmd = typeWriter(term.cmd, frame, term.cmdStart, 4);
  const cmdDone = typedCmd.length >= term.cmd.length;

  return (
    <div
      style={{
        position: "absolute",
        left: `calc(50% + ${left + COL_W / 2}px)`,
        top,
        width: COL_W,
        height: COL_H,
        transform: `translateX(-50%) translateY(${translateY + ambient.driftY}px) scale(${ambient.scale})`,
        opacity,
        background: tokens.color.bg,
        border: `2px solid ${term.color}`,
        borderRadius: 10,
        boxShadow: `0 0 ${22 * ambient.glow}px ${term.color}${Math.round(0x55 * ambient.glow).toString(16).padStart(2, "0")}`,
        padding: 14,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 13,
          color: term.color,
          fontWeight: 600,
          letterSpacing: 0.5,
          minHeight: 18,
        }}
      >
        <span style={{ color: tokens.color.textSubtle }}>{"> "}</span>
        {typedInvocation}
        {typedInvocation.length > 0 && typedInvocation.length < term.invocation.length && (
          <Caret color={term.color} />
        )}
      </div>
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 14,
          color: tokens.color.white,
          fontWeight: 600,
          minHeight: 20,
        }}
      >
        {typedCmd}
        {typedCmd.length > 0 && !cmdDone && <Caret />}
      </div>
      <div
        style={{
          flex: 1,
          fontFamily: tokens.font.mono,
          fontSize: 12,
          lineHeight: 1.45,
          color: tokens.color.textMuted,
        }}
      >
        {term.outLines.map((line, i) => {
          const lineStart = term.outStart + i * 14;
          const typed = typeWriter(line, frame, lineStart, 4);
          const isPass = line.includes("passed") || line.startsWith("✓") || line.includes("==");
          const isTyping = typed.length > 0 && typed.length < line.length;
          return (
            <div
              key={i}
              style={{
                whiteSpace: "pre",
                color: isPass && typed.length === line.length ? term.color : tokens.color.textMuted,
                fontWeight: isPass ? 700 : 400,
                minHeight: 16,
              }}
            >
              {typed || " "}
              {isTyping && <Caret color={tokens.color.textMuted} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Flow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const step3CaptionEnter = spring({
    frame: frame - STEP3_START - 90,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.9, stiffness: 100 },
  });
  const captionOpacity = interpolate(step3CaptionEnter, [0, 1], [0, 1]);
  const captionY = interpolate(step3CaptionEnter, [0, 1], [16, 0]);

  return (
    <>
      <SceneLayout
        eyebrow={t().eyebrowFlow}
        headline={t().headlineFlow}
      >
        <div
          style={{
            position: "relative",
            width: 1400,
            height: 720,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Step 1: spec card centered at the top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <SpecCard />
          </div>

          {/* Step 2-3: parallel terminals */}
          <div
            style={{
              position: "absolute",
              top: 200,
              left: 0,
              right: 0,
              bottom: 50,
            }}
          >
            {terminals.map((term, i) => (
              <TerminalCard key={term.invocation} term={term} index={i} total={terminals.length} />
            ))}
          </div>

          {/* Final caption */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: tokens.font.sans,
              fontSize: 28,
              fontWeight: 700,
              color: tokens.color.primary,
              letterSpacing: 1,
              opacity: captionOpacity,
              transform: `translateY(${captionY}px)`,
              textShadow: `0 0 16px ${tokens.color.primary}90`,
            }}
          >
            {t().flowStep3}
          </div>
        </div>
      </SceneLayout>
      <ChapterIndicator chapter={4} name="Proof" />
    </>
  );
};
