import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { tokens, t } from "../tokens";

const CANVAS_W = 1600;
const CANVAS_H = 520;
const BOX_W = 260;
const BOX_H = 110;
const BOX_GAP = 240;
const ROW_Y = 140;

type Node = {
  label: string;
  color: string;
  delay: number;
};

const nodes: Node[] = [
  { label: "仕様書", color: tokens.color.primary, delay: 0 },
  { label: "テスト", color: tokens.color.accentE2e, delay: 18 },
  { label: "カバレッジ", color: tokens.color.accentContract, delay: 36 },
];

const totalRowWidth = nodes.length * BOX_W + (nodes.length - 1) * BOX_GAP;
const rowStartX = (CANVAS_W - totalRowWidth) / 2;
const boxXFor = (idx: number) => rowStartX + idx * (BOX_W + BOX_GAP);
const boxCenterY = ROW_Y + BOX_H / 2;

const NodeBox: React.FC<{ node: Node; index: number }> = ({ node, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - 20 - node.delay,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 14, mass: 0.7, stiffness: 110 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.85, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: boxXFor(index),
        top: ROW_Y,
        width: BOX_W,
        height: BOX_H,
        background: `${node.color}1A`,
        border: `2.5px solid ${node.color}`,
        borderRadius: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: tokens.font.sans,
        fontSize: 44,
        fontWeight: 700,
        color: tokens.color.white,
        letterSpacing: -1,
        opacity,
        transform: `scale(${scale})`,
        boxShadow: `0 0 24px ${node.color}40`,
      }}
    >
      {node.label}
    </div>
  );
};

const ForwardArrow: React.FC<{
  fromIdx: number;
  toIdx: number;
  label: string;
  delay: number;
}> = ({ fromIdx, toIdx, label, delay }) => {
  const frame = useCurrentFrame() - 70 - delay;
  const progress = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOpacity = interpolate(frame, [20, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const startX = boxXFor(fromIdx) + BOX_W;
  const endX = boxXFor(toIdx);
  const curEndX = startX + (endX - startX) * progress;
  const y = boxCenterY;

  return (
    <g>
      <line
        x1={startX}
        y1={y}
        x2={curEndX}
        y2={y}
        stroke={tokens.color.textMuted}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={curEndX} cy={y} r={7} fill={tokens.color.textMuted} />
      <text
        x={(startX + endX) / 2}
        y={y - 18}
        fill={tokens.color.textMuted}
        fontFamily={tokens.font.mono}
        fontSize={22}
        fontWeight={500}
        textAnchor="middle"
        opacity={labelOpacity}
      >
        {label}
      </text>
    </g>
  );
};

const ReturnArc: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame() - 100 - delay;
  const progress = interpolate(frame, [0, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOpacity = interpolate(frame, [28, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const startX = boxXFor(2) + BOX_W / 2;
  const startY = ROW_Y + BOX_H;
  const endX = boxXFor(0) + BOX_W / 2;
  const endY = ROW_Y + BOX_H;
  const arcDepth = 220;
  const ctrlX = (startX + endX) / 2;
  const ctrlY = startY + arcDepth;
  const color = tokens.color.primary;

  const pointOnQuadratic = (tt: number) => {
    const x = (1 - tt) * (1 - tt) * startX + 2 * (1 - tt) * tt * ctrlX + tt * tt * endX;
    const y = (1 - tt) * (1 - tt) * startY + 2 * (1 - tt) * tt * ctrlY + tt * tt * endY;
    return { x, y };
  };
  const cur = pointOnQuadratic(progress);

  const arcPath = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
  const arcLength = 1200;
  const dashOffset = (1 - progress) * arcLength;

  return (
    <g>
      <path
        d={arcPath}
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={arcLength}
        strokeDashoffset={dashOffset}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
      <circle cx={cur.x} cy={cur.y} r={8} fill={color} />
      <text
        x={ctrlX}
        y={ctrlY + 8}
        fill={color}
        fontFamily={tokens.font.sans}
        fontSize={26}
        fontWeight={700}
        textAnchor="middle"
        opacity={labelOpacity}
      >
        観点漏れ検出
      </text>
    </g>
  );
};

export const V10Loop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const subEnter = spring({
    frame: frame - 160,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const subOpacity = interpolate(subEnter, [0, 1], [0, 1]);
  const subY = interpolate(subEnter, [0, 1], [12, 0]);

  return (
    <SceneLayout
      eyebrow={t().v10LoopEyebrow}
      headline={t().v10LoopHeadline}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            width: CANVAS_W,
            height: CANVAS_H,
          }}
        >
          <svg
            width={CANVAS_W}
            height={CANVAS_H}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
          >
            <ForwardArrow fromIdx={0} toIdx={1} label="/kiwa-forge" delay={0} />
            <ForwardArrow fromIdx={1} toIdx={2} label="forge coverage" delay={20} />
            <ReturnArc delay={0} />
          </svg>
          {nodes.map((node, idx) => (
            <NodeBox key={node.label} node={node} index={idx} />
          ))}
        </div>
        <div
          style={{
            fontFamily: tokens.font.sans,
            fontSize: 28,
            fontWeight: 600,
            color: tokens.color.primary,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            letterSpacing: 0.5,
            marginTop: 8,
          }}
        >
          {t().v10LoopSub}
        </div>
      </div>
    </SceneLayout>
  );
};
