import React from "react";
import { Composition, Sequence, AbsoluteFill } from "remotion";
import { C, FPS } from "./theme";
import { SEC, TOTAL_FRAMES } from "./data/sections";
import { ColdOpen } from "./scenes/ColdOpen";
import { Stakes } from "./scenes/Stakes";
import { TwoStatements } from "./scenes/TwoStatements";
import { Counting } from "./scenes/Counting";
import { Levers } from "./scenes/Levers";
import { ShipsVsBarrels } from "./scenes/ShipsVsBarrels";
import { Meaning } from "./scenes/Meaning";
import { KineticCaptions } from "./components/KineticCaptions";
import { FilmGrade } from "./components/FilmGrade";

const S = (a: number, b: number) => ({
  from: Math.round(a * FPS),
  dur: Math.round((b - a) * FPS),
});

export const RemotionRoot: React.FC = () => {
  const cold = S(SEC.cold[0], SEC.cold[1]);
  const stakes = S(SEC.stakes[0], SEC.stakes[1]);
  const two = S(SEC.twoStatements[0], SEC.twoStatements[1]);
  const count = S(SEC.counting[0], SEC.counting[1]);
  const lev = S(SEC.levers[0], SEC.levers[1]);
  const bar = S(SEC.barrels[0], SEC.barrels[1]);
  const mean = S(SEC.meaning[0], SEC.meaning[1]);
  return (
    <>
      <Composition
        id="Hormuz"
        component={() => (
          <AbsoluteFill style={{ background: C.bg }}>
            <Sequence from={cold.from} durationInFrames={cold.dur}><ColdOpen /></Sequence>
            <Sequence from={stakes.from} durationInFrames={stakes.dur}><Stakes /></Sequence>
            <Sequence from={two.from} durationInFrames={two.dur}><TwoStatements /></Sequence>
            <Sequence from={count.from} durationInFrames={count.dur}><Counting /></Sequence>
            <Sequence from={lev.from} durationInFrames={lev.dur}><Levers /></Sequence>
            <Sequence from={bar.from} durationInFrames={bar.dur}><ShipsVsBarrels /></Sequence>
            <Sequence from={mean.from} durationInFrames={mean.dur}><Meaning /></Sequence>
            <KineticCaptions />
            <FilmGrade />
          </AbsoluteFill>
        )}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
