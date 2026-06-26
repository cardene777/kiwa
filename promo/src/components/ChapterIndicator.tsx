import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { tokens } from "../tokens";

type Props = {
  chapter: number;
  name: string;
};

/**
 * Top-right chapter indicator. Fades in during the first ~30 frames of a scene
 * to give viewers a "next chapter" signal without interrupting the scene body.
 * Matches the spec in references/narrative-templates.md § 章境界の視覚化.
 */
export const ChapterIndicator: React.FC<Props> = ({ chapter, name }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 4,
    fps,
    from: 0,
    to: 1,
    config: { damping: 16, mass: 0.9, stiffness: 95 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [-6, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        right: 80,
        fontFamily: tokens.font.mono,
        fontSize: 18,
        fontWeight: 600,
        color: tokens.color.textSubtle,
        letterSpacing: 3,
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        textTransform: "uppercase",
        zIndex: 10,
      }}
    >
      <span style={{ color: `${tokens.color.primary}aa` }}>Ch.{chapter}</span>
      <span style={{ color: tokens.color.textMuted }}>·</span>
      <span>{name}</span>
    </div>
  );
};
