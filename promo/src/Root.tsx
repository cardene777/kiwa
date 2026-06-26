import { Composition, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { Opening } from "./scenes/Opening";
import { Problem } from "./scenes/Problem";
import { OneSpec } from "./scenes/OneSpec";
import { TestSurfaces } from "./scenes/TestSurfaces";
import { Polyglot } from "./scenes/Polyglot";
import { Flow } from "./scenes/Flow";
import { QualityGates } from "./scenes/QualityGates";
import { Install } from "./scenes/Install";
import { Outro } from "./scenes/Outro";
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
        durationInFrames={80 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Opening"
        component={Opening}
        durationInFrames={4 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Problem"
        component={Problem}
        durationInFrames={4 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="OneSpec"
        component={OneSpec}
        durationInFrames={10 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="TestSurfaces"
        component={TestSurfaces}
        durationInFrames={16 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Polyglot"
        component={Polyglot}
        durationInFrames={8 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Flow"
        component={Flow}
        durationInFrames={16 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="QualityGates"
        component={QualityGates}
        durationInFrames={10 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Install"
        component={Install}
        durationInFrames={10 * tokens.fps}
        {...baseProps}
      />
      <Composition
        id="Outro"
        component={Outro}
        durationInFrames={2 * tokens.fps}
        {...baseProps}
      />
    </>
  );
};
