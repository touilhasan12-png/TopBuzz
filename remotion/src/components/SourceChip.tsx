import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO } from "../theme";

export const SourceChip: React.FC<{
  label: string;
  delay?: number;
  color?: string;
}> = ({ label, delay = 0, color = C.dim }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 20,
        letterSpacing: 2,
        color,
        border: `1px solid ${C.line}`,
        padding: "6px 14px",
        borderRadius: 4,
        opacity: s,
        transform: `translateY(${(1 - s) * 8}px)`,
        background: "rgba(6,11,20,0.72)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};

/** Big eased counter. */
export const CountUp: React.FC<{
  from: number;
  to: number;
  start: number;
  dur?: number;
  suffix?: string;
  prefix?: string;
  size?: number;
  color?: string;
  decimals?: number;
}> = ({ from, to, start, dur = 45, suffix = "", prefix = "", size = 120, color = C.ink, decimals = 0 }) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [start, start + dur], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return (
    <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: size, color, fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {to >= 100 ? Math.round(v).toLocaleString("en-US") : v.toFixed(decimals)}
      {suffix}
    </span>
  );
};
