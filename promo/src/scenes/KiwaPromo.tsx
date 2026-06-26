import { Series } from "remotion";
import { Opening } from "./Opening";
import { Problem } from "./Problem";
import { Solution } from "./Solution";
import { FrameworkMatrix } from "./FrameworkMatrix";
import { DemoSpec } from "./DemoSpec";
import { DemoSpecResult } from "./DemoSpecResult";
import { DemoTest } from "./DemoTest";
import { Coverage } from "./Coverage";
import { Install } from "./Install";
import { Outro } from "./Outro";
import { tokens } from "../tokens";

export const KiwaPromo: React.FC = () => {
  const f = tokens.fps;
  return (
    <Series>
      <Series.Sequence durationInFrames={4 * f}>
        <Opening />
      </Series.Sequence>
      <Series.Sequence durationInFrames={9 * f}>
        <Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={8 * f}>
        <Solution />
      </Series.Sequence>
      <Series.Sequence durationInFrames={6 * f}>
        <FrameworkMatrix />
      </Series.Sequence>
      <Series.Sequence durationInFrames={11 * f}>
        <DemoSpec />
      </Series.Sequence>
      <Series.Sequence durationInFrames={5 * f}>
        <DemoSpecResult />
      </Series.Sequence>
      <Series.Sequence durationInFrames={9 * f}>
        <DemoTest />
      </Series.Sequence>
      <Series.Sequence durationInFrames={6 * f}>
        <Coverage />
      </Series.Sequence>
      <Series.Sequence durationInFrames={10 * f}>
        <Install />
      </Series.Sequence>
      <Series.Sequence durationInFrames={3 * f}>
        <Outro />
      </Series.Sequence>
    </Series>
  );
};
