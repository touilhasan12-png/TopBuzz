import React from "react";
import { AbsoluteFill, useCurrentFrame, staticFile, Img } from "remotion";
import { C } from "../theme";

/** Cinematic finish: vignette + letterbox + animated grain (procedural). */
export const FilmGrade: React.FC<{ letterbox?: boolean }> = ({ letterbox = true }) => {
  const f = useCurrentFrame();
  const g = (n: number) => {
    let x = (f * 2654435761 + n * 40503) % 65536;
    x = (x * x * 16807) % 2147483647;
    return (x % 1000) / 1000;
  };
  const dots = Array.from({ length: 260 }, (_, i) => ({
    x: g(i) * 1920,
    y: g(i + 999) * 1080,
    r: 0.6 + g(i + 7) * 1.6,
    o: 0.03 + g(i + 13) * 0.05,
  }));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="1920" height="1080" style={{ position: "absolute", opacity: 0.6 }}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#fff" opacity={d.o} />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(2,5,11,0.55) 100%)",
        }}
      />
      {letterbox && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 64, background: "#000" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: "#000" }} />
        </>
      )}
    </AbsoluteFill>
  );
};

/** Slow-zoom archival still with dark plate. */
export const BRoll: React.FC<{
  src: string;
  zoom?: number;
  dark?: number;
  panX?: number;
}> = ({ src, zoom = 1.12, dark = 0.55, panX = 24 }) => {
  const f = useCurrentFrame();
  const z = 1 + ((zoom - 1) * f) / 240;
  const x = (panX * f) / 240 - panX / 2;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: C.bg }}>
      <Img
        src={src.startsWith("http") ? src : staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${z}) translateX(${x}px)`,
          filter: "saturate(0.82) contrast(1.06)",
        }}
      />
      <AbsoluteFill style={{ background: `rgba(4,8,16,${dark})` }} />
    </AbsoluteFill>
  );
};
