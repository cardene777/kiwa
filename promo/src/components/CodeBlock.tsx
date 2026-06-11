import { useCurrentFrame, interpolate } from "remotion";
import { tokens } from "../tokens";

export type CodeLine = {
  text: string;
  type?: "keyword" | "string" | "comment" | "function" | "type" | "punct" | "plain";
  indent?: number;
};

type Props = {
  title?: string;
  language?: string;
  lines: CodeLine[];
  width?: number | string;
  height?: number | string;
  fontSize?: number;
  startFrame?: number;
  lineRevealSpeed?: number;
};

const colorByType: Record<NonNullable<CodeLine["type"]>, string> = {
  keyword: "#FF7B72",
  string: "#A5D6FF",
  comment: "#8B949E",
  function: "#D2A8FF",
  type: "#FFA657",
  punct: "#C9D1D9",
  plain: "#E6EDF3",
};

const renderTokens = (text: string) => {
  const parts = text.split(/(\".*?\"|\/\/.*$|\b(function|return|const|let|if|else|import|from|export|describe|it|test|expect|new|await|async)\b|\b[A-Z][A-Za-z0-9_]*\b|\b[a-z_]+\(|[{}()\[\];,])/g);
  return parts.filter(Boolean).map((p, i) => {
    let color = colorByType.plain;
    if (/^".*"$/.test(p)) color = colorByType.string;
    else if (/^\/\//.test(p)) color = colorByType.comment;
    else if (/^(function|return|const|let|if|else|import|from|export|describe|it|test|expect|new|await|async)$/.test(p)) color = colorByType.keyword;
    else if (/^[A-Z][A-Za-z0-9_]*$/.test(p)) color = colorByType.type;
    else if (/^[a-z_]+\($/.test(p)) color = colorByType.function;
    else if (/^[{}()\[\];,]$/.test(p)) color = colorByType.punct;
    return (
      <span key={i} style={{ color }}>
        {p}
      </span>
    );
  });
};

export const CodeBlock: React.FC<Props> = ({
  title,
  language = "ts",
  lines,
  width = 1280,
  height = 720,
  fontSize = 26,
  startFrame = 0,
  lineRevealSpeed = 4,
}) => {
  const frame = useCurrentFrame() - startFrame;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124, 179, 66, 0.15)",
        display: "flex",
        flexDirection: "column",
        background: "#0D1117",
      }}
    >
      {title && (
        <div
          style={{
            padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
            background: "#161B22",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: tokens.font.mono,
            fontSize: 18,
            color: tokens.color.textMuted,
          }}
        >
          <span>{title}</span>
          <span style={{ color: tokens.color.primary, fontWeight: 600 }}>
            {language}
          </span>
        </div>
      )}
      <div
        style={{
          flex: 1,
          padding: tokens.spacing.md,
          fontFamily: tokens.font.mono,
          fontSize,
          lineHeight: 1.55,
          color: colorByType.plain,
          overflow: "hidden",
        }}
      >
        {lines.map((line, idx) => {
          const lineFrame = frame - idx * lineRevealSpeed;
          const opacity = interpolate(lineFrame, [0, 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const tx = interpolate(lineFrame, [0, 6], [-12, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          if (opacity < 0.01) return null;
          return (
            <div
              key={idx}
              style={{
                opacity,
                transform: `translateX(${tx}px)`,
                paddingLeft: (line.indent ?? 0) * 16,
                whiteSpace: "pre",
              }}
            >
              {renderTokens(line.text)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
