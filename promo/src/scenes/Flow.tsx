import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { ChapterIndicator } from "../components/ChapterIndicator";
import { tokens, t } from "../tokens";

type Terminal = {
  title: string;
  cmd: string;
  pass: string;
  color: string;
};

const terminals: Terminal[] = [
  {
    title: "/kiwa-forge → forge test",
    cmd: "$ forge test",
    pass: "Ran 47 tests · 47 passed",
    color: tokens.color.accentContract,
  },
  {
    title: "/kiwa-hardhat → hardhat test",
    cmd: "$ npx hardhat test",
    pass: "32 passing · 0 failing",
    color: tokens.color.accentContract,
  },
  {
    title: "/kiwa-vitest → vitest run",
    cmd: "$ vitest run",
    pass: "8 files · 86 tests · all passed",
    color: tokens.color.accentApi,
  },
  {
    title: "/kiwa-play → playwright test",
    cmd: "$ playwright test",
    pass: "23 specs · 4-round zero flake",
    color: tokens.color.accentE2e,
  },
  {
    title: "kiwa-test-py → pytest",
    cmd: "$ pytest tests/",
    pass: "==== 14 passed in 1.2s ====",
    color: tokens.color.accentPy,
  },
];

const FLOW_STEP_OFFSETS = {
  step1: 0,
  step2: 130,
  step3: 360,
} as const;

const SPEC_LINES = [
  { text: "# tests/spec/test-spec-tokenGating.md", emphasis: "title" as const },
  { text: "", emphasis: "blank" as const },
  { text: "| TC ID | mode | observation | boundary | P |", emphasis: "header" as const },
  { text: "|-------|------|-------------|----------|---|", emphasis: "rule" as const },
  { text: "| T-001 | render | balance == 1 | 0 / 1 / max | P0 |", emphasis: "row" as const },
  { text: "| T-002 | interaction | mint click | gas budget | P0 |", emphasis: "row" as const },
  { text: "| T-003 | snapshot | gated DOM | logged-in / out | P1 |", emphasis: "row" as const },
  { text: "", emphasis: "blank" as const },
  { text: "✓ 9 columns × 47 rows generated", emphasis: "complete" as const },
];

const SpecCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - FLOW_STEP_OFFSETS.step1,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.8, stiffness: 95 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [16, 0]);

  const exitFrame = frame - (FLOW_STEP_OFFSETS.step2 + 60);
  const exitOpacity = interpolate(exitFrame, [0, 24], [1, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 760,
        background: `linear-gradient(135deg, ${tokens.color.primary}18 0%, ${tokens.color.primary}03 100%)`,
        border: `2px solid ${tokens.color.primary}`,
        borderRadius: 14,
        padding: "22px 28px",
        boxSizing: "border-box",
        opacity: opacity * exitOpacity,
        transform: `translateY(${translateY}px)`,
        boxShadow: `0 0 28px ${tokens.color.primary}40`,
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 20,
          fontWeight: 600,
          color: tokens.color.primary,
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {t().flowStep1}
      </div>
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {SPEC_LINES.map((line, idx) => {
          const lineFrame = frame - FLOW_STEP_OFFSETS.step1 - 12 - idx * 6;
          const lineOpacity = interpolate(lineFrame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const tx = interpolate(lineFrame, [0, 10], [-10, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          let color: string = tokens.color.textMuted;
          let weight = 400;
          if (line.emphasis === "title") {
            color = tokens.color.textSubtle;
          } else if (line.emphasis === "header") {
            color = tokens.color.white;
            weight = 700;
          } else if (line.emphasis === "rule") {
            color = `${tokens.color.primary}80`;
          } else if (line.emphasis === "row") {
            color = tokens.color.white;
          } else if (line.emphasis === "complete") {
            color = tokens.color.primary;
            weight = 700;
          }

          return (
            <div
              key={idx}
              style={{
                whiteSpace: "pre",
                opacity: lineOpacity,
                transform: `translateX(${tx}px)`,
                color,
                fontWeight: weight,
                minHeight: line.emphasis === "blank" ? 8 : 22,
              }}
            >
              {line.text || " "}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TerminalCard: React.FC<{ terminal: Terminal; index: number; total: number }> = ({
  terminal,
  index,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stagger = index * 5;
  const enter = spring({
    frame: frame - FLOW_STEP_OFFSETS.step2 - stagger,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.7, stiffness: 100 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [24, 0]);

  const passReveal = spring({
    frame: frame - FLOW_STEP_OFFSETS.step3 - stagger,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.6, stiffness: 110 },
  });
  const passOpacity = interpolate(passReveal, [0, 1], [0, 1]);

  // Layout: top row 3 terminals, bottom row 2 (centered) — total 5
  const COL_W = 360;
  const COL_H = 200;
  const GAP = 24;
  const isTop = index < 3;
  const row = isTop ? 0 : 1;
  const col = isTop ? index : index - 3;
  const totalCols = isTop ? 3 : 2;
  const rowW = totalCols * COL_W + (totalCols - 1) * GAP;
  const leftOffset = -rowW / 2;
  const left = leftOffset + col * (COL_W + GAP);
  const top = row * (COL_H + GAP);

  return (
    <div
      style={{
        position: "absolute",
        left: `calc(50% + ${left + COL_W / 2}px)`,
        top,
        width: COL_W,
        height: COL_H,
        transform: `translateX(-50%) translateY(${translateY}px)`,
        opacity,
        background: tokens.color.bg,
        border: `2px solid ${terminal.color}`,
        borderRadius: 10,
        boxShadow: `0 0 22px ${terminal.color}40`,
        padding: 18,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 16,
            fontWeight: 600,
            color: terminal.color,
            letterSpacing: 1,
          }}
        >
          {terminal.title}
        </div>
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 12,
            color: tokens.color.textSubtle,
            background: tokens.color.bgGradientEnd,
            padding: "2px 8px",
            borderRadius: 4,
          }}
        >
          term
        </div>
      </div>
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 17,
          color: tokens.color.white,
          letterSpacing: 0.3,
        }}
      >
        {terminal.cmd}
      </div>
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 16,
          color: tokens.color.primary,
          opacity: passOpacity,
          letterSpacing: 0.3,
          marginTop: "auto",
        }}
      >
        ✓ {terminal.pass}
      </div>
    </div>
  );
};

export const Flow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const step1Visible = frame >= FLOW_STEP_OFFSETS.step1 && frame < FLOW_STEP_OFFSETS.step2 + 100;
  const step2Visible = frame >= FLOW_STEP_OFFSETS.step2 - 10;
  const step3Visible = frame >= FLOW_STEP_OFFSETS.step3 - 10;

  void step1Visible;

  const step2Caption = step2Visible
    ? spring({
        frame: frame - FLOW_STEP_OFFSETS.step2,
        fps,
        from: 0,
        to: 1,
        config: { damping: 14, mass: 0.8, stiffness: 100 },
      })
    : 0;
  const step3Caption = step3Visible
    ? spring({
        frame: frame - FLOW_STEP_OFFSETS.step3 - 30,
        fps,
        from: 0,
        to: 1,
        config: { damping: 14, mass: 0.8, stiffness: 100 },
      })
    : 0;

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
          height: 660,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Step 1 — Spec card centered */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <SpecCard />
        </div>

        {/* Step 2 — Parallel terminals */}
        <div
          style={{
            position: "absolute",
            top: 200,
            left: 0,
            right: 0,
            height: 460,
            opacity: step2Caption,
          }}
        >
          {terminals.map((term, i) => (
            <TerminalCard key={term.title} terminal={term} index={i} total={terminals.length} />
          ))}
        </div>

        {/* Step 3 — Caption */}
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: tokens.font.sans,
            fontSize: 30,
            fontWeight: 700,
            color: tokens.color.primary,
            letterSpacing: 0.5,
            opacity: step3Caption,
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
