import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, ARCHIVO, MONO } from "../theme";

/** Chapter card: 'PART ONE / THE STAKES' smacked mid-screen over dimmed scene. */
export const ChapterCard: React.FC<{
  kicker: string;
  title: string;
  at?: number;
  hold?: number;
}> = ({ kicker, title, at = 0, hold = 60 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - at;
  if (t < 0 || t > hold + 20) return null;
  const s = spring({ frame: t, fps, config: { damping: 16, mass: 0.9 } });
  const out = interpolate(t, [hold, hold + 20], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `rgba(3,6,12,${0.72 * out})`,
        opacity: out,
      }}
    >
      <div style={{ transform: `scale(${0.92 + s * 0.08})`, opacity: Math.min(1, s * 1.4), textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: C.red, marginBottom: 18 }}>
          {kicker}
        </div>
        <div style={{
          fontFamily: ARCHIVO, fontWeight: 900, fontSize: 110, color: C.ink,
          letterSpacing: 2, textTransform: "uppercase", lineHeight: 1.02,
        }}>
          {title}
        </div>
        <div style={{ width: 220 * s, height: 4, background: C.red, margin: "26px auto 0" }} />
      </div>
    </AbsoluteFill>
  );
};
