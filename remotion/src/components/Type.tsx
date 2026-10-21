import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, ARCHIVO, MONO } from "../theme";

export const GlitchTitle: React.FC<{
  text: string;
  at: number;
  size?: number;
  color?: string;
}> = ({ text, at, size = 130, color = C.ink }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0) return null;
  const jitter = t < 14 ? Math.sin(t * 13.7) * (14 - t) * 0.9 : 0;
  const op = interpolate(t, [0, 3, 5, 7, 10], [0, 0.5, 0.15, 1, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        fontFamily: ARCHIVO,
        fontWeight: 900,
        fontSize: size,
        color,
        letterSpacing: 1,
        textTransform: "uppercase",
        lineHeight: 1.0,
        opacity: op,
        transform: `translateX(${jitter}px)`,
        textShadow: t < 14 ? `${-jitter}px 0 ${C.red}` : "none",
      }}
    >
      {text}
    </div>
  );
};

export const SlamLine: React.FC<{
  text: string;
  at: number;
  size?: number;
  color?: string;
  weight?: number;
  spacing?: number;
  center?: boolean;
}> = ({ text, at, size = 64, color = C.ink, weight = 700, spacing = 1, center = true }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 15, mass: 0.8, stiffness: 160 } });
  if (f < at) return null;
  return (
    <div
      style={{
        fontFamily: ARCHIVO,
        fontWeight: weight,
        fontSize: size,
        color,
        letterSpacing: spacing,
        textTransform: "uppercase",
        opacity: Math.min(1, s * 1.5),
        transform: `scale(${1.06 - s * 0.06})`,
        textAlign: center ? "center" : "left",
        lineHeight: 1.08,
      }}
    >
      {text}
    </div>
  );
};

export const TypeLine: React.FC<{
  text: string;
  at: number;
  size?: number;
  color?: string;
  cps?: number;
}> = ({ text, at, size = 30, color = C.dim, cps = 30 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f - at;
  if (t < 0) return null;
  const n = Math.min(text.length, Math.floor((t / fps) * cps));
  return (
    <div style={{ fontFamily: MONO, fontSize: size, color, letterSpacing: 2 }}>
      {text.slice(0, n)}
      {n < text.length && <span style={{ opacity: 0.7 }}>▌</span>}
    </div>
  );
};

export const Fade: React.FC<{
  at: number;
  out?: number;
  dur?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, out, dur = 12, children, style }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const i = interpolate(f, [at, at + dur], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const o = out ? interpolate(f, [out, out + dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <div style={{ opacity: i * o, ...style }}>
      {children}
    </div>
  );
};
