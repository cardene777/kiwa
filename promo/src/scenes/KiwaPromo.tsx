import { Series } from "remotion";
import { V8Hook } from "./V8Hook";
import { V8Idea } from "./V8Idea";
import { V8Scale } from "./V8Scale";
import { V8Setup } from "./V8Setup";
import { V8Generate } from "./V8Generate";
import { V8Pass } from "./V8Pass";
import { tokens } from "../tokens";

export const KiwaPromo: React.FC = () => {
  const f = tokens.fps;
  return (
    <Series>
      <Series.Sequence durationInFrames={6 * f}>
        <V8Hook />
      </Series.Sequence>
      <Series.Sequence durationInFrames={8 * f}>
        <V8Idea />
      </Series.Sequence>
      <Series.Sequence durationInFrames={11 * f}>
        <V8Scale />
      </Series.Sequence>
      <Series.Sequence durationInFrames={8 * f}>
        <V8Setup />
      </Series.Sequence>
      <Series.Sequence durationInFrames={12 * f}>
        <V8Generate />
      </Series.Sequence>
      <Series.Sequence durationInFrames={5 * f}>
        <V8Pass />
      </Series.Sequence>
    </Series>
  );
};
