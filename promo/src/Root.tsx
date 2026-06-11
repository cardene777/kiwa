import { Composition } from "remotion";
import { Opening } from "./scenes/Opening";
import { Outro } from "./scenes/Outro";
import { tokens } from "./tokens";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Opening"
        component={Opening}
        durationInFrames={5 * tokens.fps}
        fps={tokens.fps}
        width={1920}
        height={1080}
      />
      <Composition
        id="Outro"
        component={Outro}
        durationInFrames={5 * tokens.fps}
        fps={tokens.fps}
        width={1920}
        height={1080}
      />
    </>
  );
};
