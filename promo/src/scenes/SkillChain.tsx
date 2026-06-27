import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { ChapterIndicator } from "../components/ChapterIndicator";
import { useAmbientMotion } from "../components/useAmbientMotion";
import { tokens, t } from "../tokens";

type Skill = {
  name: string;
  role: string;
  color: string;
};

const skills: Skill[] = [
  { name: "/kiwa-design", role: "Layer 1 spec", color: tokens.color.primary },
  { name: "/kiwa-forge", role: "Foundry test", color: tokens.color.accentContract },
  { name: "/kiwa-hardhat", role: "Hardhat test", color: tokens.color.accentContract },
  { name: "/kiwa-vitest", role: "unit / TSX", color: tokens.color.accentApi },
  { name: "/kiwa-api", role: "msw + supertest", color: tokens.color.accentApi },
  { name: "/kiwa-play", role: "Playwright e2e", color: tokens.color.accentE2e },
  { name: "/kiwa-review", role: "spec / test review", color: tokens.color.accentA11y },
  { name: "/kiwa-test", role: "orchestrator", color: tokens.color.accentManual },
];

const TILE_W = 200;
const TILE_H = 120;
const GAP_X = 14;
const COLS = 4;
const ROWS = 2;
const GRID_W = COLS * TILE_W + (COLS - 1) * GAP_X;
const GRID_H = ROWS * TILE_H + 28;

const SkillTile: React.FC<{ skill: Skill; index: number }> = ({ skill, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 14 - index * 3,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.7, stiffness: 110 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const entranceY = interpolate(enter, [0, 1], [18, 0]);
  const entranceScale = interpolate(enter, [0, 1], [0.94, 1]);

  // 8 skill tiles desynced with index*11.
  const ambient = useAmbientMotion({ phase: index * 11 });

  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const left = col * (TILE_W + GAP_X);
  const top = row * (TILE_H + 28);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: TILE_W,
        height: TILE_H,
        background: `linear-gradient(135deg, ${skill.color}1F 0%, ${skill.color}04 100%)`,
        border: `2px solid ${skill.color}`,
        borderRadius: 14,
        opacity,
        transform: `translate(${ambient.driftX}px, ${entranceY + ambient.driftY}px) scale(${entranceScale * ambient.scale})`,
        boxShadow: `0 0 ${22 * ambient.glow}px ${skill.color}${Math.round(0x44 * ambient.glow).toString(16).padStart(2, "0")}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "12px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 20,
          fontWeight: 700,
          color: skill.color,
          letterSpacing: -0.3,
        }}
      >
        {skill.name}
      </div>
      <div
        style={{
          fontFamily: tokens.font.sans,
          fontSize: 16,
          color: tokens.color.textMuted,
          letterSpacing: 0.3,
        }}
      >
        {skill.role}
      </div>
    </div>
  );
};

export const SkillChain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionEnter = spring({
    frame: frame - 130,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.9, stiffness: 95 },
  });
  const captionOpacity = interpolate(captionEnter, [0, 1], [0, 1]);
  const captionY = interpolate(captionEnter, [0, 1], [16, 0]);

  return (
    <>
      <SceneLayout
        eyebrow={t().eyebrowSkillChain}
        headline={t().headlineSkillChain}
      >
        <div
          style={{
            position: "relative",
            width: GRID_W,
            height: GRID_H + 70,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: GRID_W,
              height: GRID_H,
            }}
          >
            {skills.map((skill, i) => (
              <SkillTile key={skill.name} skill={skill} index={i} />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: tokens.font.mono,
              fontSize: 24,
              fontWeight: 600,
              color: tokens.color.primary,
              letterSpacing: 2,
              opacity: captionOpacity,
              transform: `translateY(${captionY}px)`,
              textShadow: `0 0 16px ${tokens.color.primary}70`,
            }}
          >
            {t().skillChainCaption}
          </div>
        </div>
      </SceneLayout>
      <ChapterIndicator chapter={4} name="Proof" />
    </>
  );
};
