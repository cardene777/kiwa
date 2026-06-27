import { Composition, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { V8Hook } from "./scenes/V8Hook";
import { V8Idea } from "./scenes/V8Idea";
import { V8Scale } from "./scenes/V8Scale";
import { V8Setup } from "./scenes/V8Setup";
import { V8Generate } from "./scenes/V8Generate";
import { V8Pass } from "./scenes/V8Pass";
import { KiwaPromo } from "./scenes/KiwaPromo";
import { tokens } from "./tokens";

const baseProps = {
  fps: tokens.fps,
  width: 1920,
  height: 1080,
};

const useNotoSansJP = () => {
  const [handle] = useState(() => delayRender("Loading Noto Sans JP"));

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap";
    link.onload = () => continueRender(handle);
    link.onerror = () => continueRender(handle);
    document.head.appendChild(link);
  }, [handle]);
};

export const RemotionRoot: React.FC = () => {
  useNotoSansJP();
  return (
    <>
      <Composition
        id="KiwaPromo"
        component={KiwaPromo}
        durationInFrames={50 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="V8Hook"
        component={V8Hook}
        durationInFrames={6 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="V8Idea"
        component={V8Idea}
        durationInFrames={8 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="V8Scale"
        component={V8Scale}
        durationInFrames={11 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="V8Setup"
        component={V8Setup}
        durationInFrames={8 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="V8Generate"
        component={V8Generate}
        durationInFrames={12 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="V8Pass"
        component={V8Pass}
        durationInFrames={5 * tokens.fps}
        {...baseProps}
      />
    </>
  );
};
