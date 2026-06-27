import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Caret } from "../components/Caret";
import { tokens, t } from "../tokens";

const typeWriter = (text: string, frame: number, start: number, cps = 2.6) => {
  const chars = Math.max(0, Math.floor((frame - start) * cps));
  return text.slice(0, chars);
};

type TerminalCardProps = {
  title: string;
  cmd: string;
  log: string;
  startFrame: number;
  logDelay: number;
  width?: number;
};

const TerminalCard: React.FC<TerminalCardProps> = ({
  title,
  cmd,
  log,
  startFrame,
  logDelay,
  width = 580,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - startFrame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 14, mass: 0.7, stiffness: 110 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const ty = interpolate(enter, [0, 1], [20, 0]);

  const cmdTyped = typeWriter(cmd, frame, startFrame + 8, 2.6);
  const cmdActive = cmdTyped.length > 0 && cmdTyped.length < cmd.length;

  const logTyped = typeWriter(log, frame, startFrame + logDelay, 2.8);
  const logActive = logTyped.length > 0 && logTyped.length < log.length;

  return (
    <div
      style={{
        width,
        background: "#0B0F18",
        borderRadius: 12,
        border: `1px solid ${tokens.color.primary}33`,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity,
        transform: `translateY(${ty}px)`,
        fontFamily: tokens.font.mono,
        fontSize: 18,
        lineHeight: 1.55,
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          color: tokens.color.primary,
          fontWeight: 700,
          letterSpacing: 0.5,
          fontSize: 18,
        }}
      >
        {title}
      </div>
      <div style={{ color: tokens.color.white, whiteSpace: "pre", minHeight: 26 }}>
        {cmdTyped}
        {cmdActive && <Caret height={20} width={9} />}
      </div>
      {logTyped.length > 0 && (
        <div style={{ color: tokens.color.textMuted, whiteSpace: "pre", minHeight: 26 }}>
          {logTyped}
          {logActive && <Caret height={20} width={9} color={tokens.color.textMuted} />}
        </div>
      )}
    </div>
  );
};

export const V9Flow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowEnter = spring({
    frame: frame - 6,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const eyebrowOpacity = interpolate(eyebrowEnter, [0, 1], [0, 1]);
  const headlineEnter = spring({
    frame: frame - 16,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
    config: { damping: 16, mass: 1, stiffness: 95 },
  });
  const headlineOpacity = interpolate(headlineEnter, [0, 1], [0, 1]);
  const headlineY = interpolate(headlineEnter, [0, 1], [14, 0]);

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
          padding: 70,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 24,
              fontWeight: 500,
              color: tokens.color.primary,
              letterSpacing: 6,
              textTransform: "uppercase",
              opacity: eyebrowOpacity,
            }}
          >
            {t().v9FlowEyebrow}
          </div>
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: tokens.locale === "ja" ? 44 : 42,
              fontWeight: 700,
              color: tokens.color.white,
              letterSpacing: -1,
              opacity: headlineOpacity,
              transform: `translateY(${headlineY}px)`,
            }}
          >
            {t().v9FlowHeadline}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minHeight: 0,
            justifyContent: "center",
          }}
        >
          {/* Step 1: kiwa-design */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <TerminalCard
              title={t().v9FlowTerm1Title}
              cmd={t().v9FlowTerm1Cmd}
              log={t().v9FlowTerm1Log}
              startFrame={50}
              logDelay={40}
              width={900}
            />
          </div>
          {/* Step 2: forge / vitest / play parallel */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            <TerminalCard
              title={t().v9FlowTerm2aTitle}
              cmd={t().v9FlowTerm2aCmd}
              log={t().v9FlowTerm2aLog}
              startFrame={130}
              logDelay={40}
            />
            <TerminalCard
              title={t().v9FlowTerm2bTitle}
              cmd={t().v9FlowTerm2bCmd}
              log={t().v9FlowTerm2bLog}
              startFrame={138}
              logDelay={40}
            />
            <TerminalCard
              title={t().v9FlowTerm2cTitle}
              cmd={t().v9FlowTerm2cCmd}
              log={t().v9FlowTerm2cLog}
              startFrame={146}
              logDelay={40}
            />
          </div>
          {/* Step 3: kiwa-review */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <TerminalCard
              title={t().v9FlowTerm3Title}
              cmd={t().v9FlowTerm3Cmd}
              log={t().v9FlowTerm3Log}
              startFrame={250}
              logDelay={40}
              width={900}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
