import { useCurrentFrame, interpolate } from "remotion";
import { tokens } from "../tokens";

export type CodeLine = {
  text: string;
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

const palette = {
  keyword: "#FF7B72",
  string: "#A5D6FF",
  comment: "#8B949E",
  number: "#79C0FF",
  function: "#D2A8FF",
  type: "#FFA657",
  punct: "#C9D1D9",
  plain: "#E6EDF3",
};

const KEYWORDS = new Set([
  "function",
  "return",
  "const",
  "let",
  "var",
  "if",
  "else",
  "import",
  "from",
  "export",
  "describe",
  "it",
  "test",
  "expect",
  "new",
  "await",
  "async",
  "contract",
  "public",
  "external",
  "view",
  "pure",
  "returns",
  "uint256",
  "address",
  "bool",
  "string",
  "memory",
  "calldata",
  "bytes",
  "true",
  "false",
  "is",
]);

type Token = {
  text: string;
  color: string;
  bold?: boolean;
};

const tokenize = (line: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;

  const trimmed = line.trimStart();
  if (trimmed.startsWith("//") || trimmed.startsWith("#")) {
    return [{ text: line, color: palette.comment }];
  }

  while (i < n) {
    const ch = line[i];

    if (ch === " " || ch === "\t") {
      let s = "";
      while (i < n && (line[i] === " " || line[i] === "\t")) {
        s += line[i];
        i++;
      }
      tokens.push({ text: s, color: palette.plain });
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let s = quote;
      i++;
      while (i < n && line[i] !== quote) {
        if (line[i] === "\\" && i + 1 < n) {
          s += line[i] + line[i + 1];
          i += 2;
        } else {
          s += line[i];
          i++;
        }
      }
      if (i < n) {
        s += quote;
        i++;
      }
      tokens.push({ text: s, color: palette.string });
      continue;
    }

    if (/[a-zA-Z_$]/.test(ch)) {
      let s = "";
      while (i < n && /[a-zA-Z0-9_$]/.test(line[i])) {
        s += line[i];
        i++;
      }
      const next = line[i];
      if (KEYWORDS.has(s)) {
        tokens.push({ text: s, color: palette.keyword });
      } else if (/^[A-Z]/.test(s)) {
        tokens.push({ text: s, color: palette.type });
      } else if (next === "(") {
        tokens.push({ text: s, color: palette.function });
      } else {
        tokens.push({ text: s, color: palette.plain });
      }
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let s = "";
      while (i < n && /[0-9_.]/.test(line[i])) {
        s += line[i];
        i++;
      }
      tokens.push({ text: s, color: palette.number });
      continue;
    }

    if (/[{}\(\)\[\];,:.]/.test(ch)) {
      tokens.push({ text: ch, color: palette.punct });
      i++;
      continue;
    }

    tokens.push({ text: ch, color: palette.plain });
    i++;
  }

  return tokens;
};

export const CodeBlock: React.FC<Props> = ({
  title,
  language = "ts",
  lines,
  width = 1280,
  height = 720,
  fontSize = 24,
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
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124, 179, 66, 0.18)",
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
            flexShrink: 0,
          }}
        >
          <span>{title}</span>
          <span style={{ color: tokens.color.primary, fontWeight: 600 }}>{language}</span>
        </div>
      )}
      <div
        style={{
          flex: 1,
          padding: tokens.spacing.md,
          fontFamily: tokens.font.mono,
          fontSize,
          lineHeight: 1.55,
          color: palette.plain,
          overflow: "hidden",
        }}
      >
        {lines.map((line, idx) => {
          const lineFrame = frame - idx * lineRevealSpeed;
          const opacity = interpolate(lineFrame, [0, 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const tx = interpolate(lineFrame, [0, 6], [-10, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          if (opacity < 0.01) return null;
          const tokensForLine = tokenize(line.text);
          return (
            <div
              key={idx}
              style={{
                opacity,
                transform: `translateX(${tx}px)`,
                paddingLeft: (line.indent ?? 0) * fontSize * 0.6,
                whiteSpace: "pre",
                minHeight: fontSize * 1.55,
              }}
            >
              {tokensForLine.length === 0 ? (
                <span>&nbsp;</span>
              ) : (
                tokensForLine.map((t, ti) => (
                  <span key={ti} style={{ color: t.color }}>
                    {t.text}
                  </span>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
