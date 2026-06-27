import { Series } from "remotion";
import { Opening } from "./Opening";
import { Problem } from "./Problem";
import { OneSpec } from "./OneSpec";
import { TestSurfaces } from "./TestSurfaces";
import { FrameworkMatrix } from "./FrameworkMatrix";
import { Polyglot } from "./Polyglot";
import { SkillChain } from "./SkillChain";
import { Flow } from "./Flow";
import { QualityGates } from "./QualityGates";
import { PackagesGrid } from "./PackagesGrid";
import { Install } from "./Install";
import { Outro } from "./Outro";
import { tokens } from "../tokens";

// v6 storyboard (Ch.1 → Ch.5, 102s @ 30fps)
//   Ch.1 Hook (8s)
//     Opening (4s) + Problem (4s)
//   Ch.2 Concept (10s)
//     OneSpec (10s)
//   Ch.3 Coverage (30s)
//     TestSurfaces (16s) + FrameworkMatrix (6s) + Polyglot (8s)
//   Ch.4 Proof (35s)
//     SkillChain (7s) + Flow (18s — screencast) + QualityGates (10s)
//   Ch.5 CTA (19s)
//     PackagesGrid (7s) + Install (10s) + Outro (2s)
// All scenes also use useAmbientMotion for subtle breath / drift / glow.

export const KiwaPromo: React.FC = () => {
  const f = tokens.fps;
  return (
    <Series>
      <Series.Sequence durationInFrames={4 * f}>
        <Opening />
      </Series.Sequence>
      <Series.Sequence durationInFrames={4 * f}>
        <Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={10 * f}>
        <OneSpec />
      </Series.Sequence>
      <Series.Sequence durationInFrames={16 * f}>
        <TestSurfaces />
      </Series.Sequence>
      <Series.Sequence durationInFrames={6 * f}>
        <FrameworkMatrix />
      </Series.Sequence>
      <Series.Sequence durationInFrames={8 * f}>
        <Polyglot />
      </Series.Sequence>
      <Series.Sequence durationInFrames={7 * f}>
        <SkillChain />
      </Series.Sequence>
      <Series.Sequence durationInFrames={18 * f}>
        <Flow />
      </Series.Sequence>
      <Series.Sequence durationInFrames={10 * f}>
        <QualityGates />
      </Series.Sequence>
      <Series.Sequence durationInFrames={7 * f}>
        <PackagesGrid />
      </Series.Sequence>
      <Series.Sequence durationInFrames={10 * f}>
        <Install />
      </Series.Sequence>
      <Series.Sequence durationInFrames={2 * f}>
        <Outro />
      </Series.Sequence>
    </Series>
  );
};
