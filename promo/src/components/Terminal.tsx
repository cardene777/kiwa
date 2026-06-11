import { useCurrentFrame, interpolate } from "remotion";
import { tokens } from "../tokens";

export type TerminalLine = {
  prompt?: string;
  content: string;
  color?: string;
  delayFrames: number;
  typeSpeed?: number;
  bold?: boolean;
};

type Props = {
  title?: string;
  lines: TerminalLine[];
  width?: number | string;
  height?: number | string;
  fontSize?: number;
  cursor?: boolean;
};

export const Terminal: React.FC<Props> = ({
  title = "kiwa",
  lines,
  width = 1280,
  height = 720,
  fontSize = 28,
  cursor = true,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124, 179, 66, 0.2)",
        display: "flex",
        flexDirection: "column",
        background: "#0B0F18",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: tokens.spacing.sm,
          padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
          background: "#161B26",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FF5F57" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FEBC2E" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#28C840" }} />
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            color: tokens.color.textMuted,
            fontSize: 18,
            fontFamily: tokens.font.mono,
            letterSpacing: 0.5,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          padding: tokens.spacing.md,
          fontFamily: tokens.font.mono,
          fontSize,
          lineHeight: 1.5,
          color: tokens.color.white,
          overflow: "hidden",
        }}
      >
        {lines.map((line, idx) => {
          const localFrame = frame - line.delayFrames;
          const typeSpeed = line.typeSpeed ?? 1.5;
          const visibleChars = Math.max(0, Math.floor(localFrame * typeSpeed));
          const fullText = line.prompt
            ? `${line.prompt} ${line.content}`
            : line.content;
          const shown = fullText.slice(0, visibleChars);
          const isTyping = visibleChars > 0 && visibleChars < fullText.length;
          const isLast = idx === lines.length - 1;
          const showCursor = cursor && (isTyping || (isLast && visibleChars >= fullText.length));
          const cursorBlink = Math.floor(frame / 15) % 2 === 0;
          const opacity = interpolate(localFrame, [0, 2], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          if (visibleChars === 0) return null;

          return (
            <div
              key={idx}
              style={{
                color: line.color ?? tokens.color.white,
                fontWeight: line.bold ? 600 : 400,
                opacity,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {line.prompt && shown.startsWith(line.prompt) ? (
                <>
                  <span style={{ color: tokens.color.primary, fontWeight: 600 }}>
                    {shown.slice(0, line.prompt.length)}
                  </span>
                  <span>{shown.slice(line.prompt.length)}</span>
                </>
              ) : (
                shown
              )}
              {showCursor && (
                <span
                  style={{
                    display: "inline-block",
                    width: fontSize * 0.55,
                    height: fontSize * 0.9,
                    background: tokens.color.primary,
                    verticalAlign: "middle",
                    marginLeft: 4,
                    opacity: cursorBlink ? 1 : 0,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
