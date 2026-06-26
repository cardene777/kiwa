import { Series } from "remotion";
import { Opening } from "./Opening";
import { Problem } from "./Problem";
import { OneSpec } from "./OneSpec";
import { TestSurfaces } from "./TestSurfaces";
import { Polyglot } from "./Polyglot";
import { Flow } from "./Flow";
import { QualityGates } from "./QualityGates";
import { Install } from "./Install";
import { Outro } from "./Outro";
import { tokens } from "../tokens";

// v2 storyboard (Ch.1 Hook → Ch.8 CTA, ≈ 80s @ 30fps)
//   Ch.1  Opening      (4s)  — tagline reveal
//   Ch.1  Problem      (4s)  — test stack scatter
//   Ch.2  OneSpec      (10s) — spec hub + 6 rays
//   Ch.3  TestSurfaces (16s) — 6-layer card grid (Component badge shows 8 adapters)
//   Ch.4  Polyglot     (8s)  — TS / Python / Solidity columns
//   Ch.5  Flow         (16s) — spec → 5 parallel terminals → green
//   Ch.6  QualityGates (10s) — Coverage + Mutation MSI table
//   Ch.7  Install      (10s) — npm install + pnpm dlx kiwa init
//   Ch.8  Outro        (2s)  — links

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
      <Series.Sequence durationInFrames={8 * f}>
        <Polyglot />
      </Series.Sequence>
      <Series.Sequence durationInFrames={16 * f}>
        <Flow />
      </Series.Sequence>
      <Series.Sequence durationInFrames={10 * f}>
        <QualityGates />
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
