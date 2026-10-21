import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

/** Procedural naval-scope background: rings, sweep, echo dots, coordinate grid. */
export const Radar: React.FC<{ intensity?: number; cx?: number; cy?: number }> = ({
  intensity = 1,
  cx = 960,
  cy = 540,
}) => {
  const f = useCurrentFrame();
  const sweep = (f * 1.7) % 360;
  const echoes = [
    { a: 24, r: 300, s: 3 },
    { a: 110, r: 390, s: 4 },
    { a: 187, r: 255, s: 2.5 },
    { a: 250, r: 430, s: 3.5 },
    { a: 322, r: 350, s: 3 },
  ];
  const ringRadii = [140, 240, 340, 440];
  return (
    <AbsoluteFill style={{ opacity: intensity }}>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        {Array.from({ length: 19 }, (_, i) => (
          <line key={"v" + i} x1={i * 106} y1={0} x2={i * 106} y2={1080} stroke={C.line} strokeWidth={0.5} opacity={0.35} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={"h" + i} x1={0} y1={i * 108} x2={1920} y2={i * 108} stroke={C.line} strokeWidth={0.5} opacity={0.35} />
        ))}
        {ringRadii.map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={C.teal} strokeWidth={1} opacity={0.16} />
        ))}
        <line x1={cx - 520} y1={cy} x2={cx + 520} y2={cy} stroke={C.teal} strokeWidth={0.8} opacity={0.2} />
        <line x1={cx} y1={cy - 520} x2={cx} y2={cy + 520} stroke={C.teal} strokeWidth={0.8} opacity={0.2} />
        <g transform={`rotate(${sweep} ${cx} ${cy})`}>
          <path
            d={`M ${cx} ${cy} L ${cx + 470} ${cy} A 470 470 0 0 0 ${cx + 470 * Math.cos(-0.35)} ${cy + 470 * Math.sin(-0.35)} Z`}
            fill="url(#sw)"
            opacity={0.5}
          />
          <line x1={cx} y1={cy} x2={cx + 470} y2={cy} stroke={C.teal} strokeWidth={2} opacity={0.75} />
        </g>
        <defs>
          <linearGradient id="sw" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.teal} stopOpacity="0.5" />
            <stop offset="100%" stopColor={C.teal} stopOpacity="0" />
          </linearGradient>
        </defs>
        {echoes.map((e, i) => {
          const ang = (e.a * Math.PI) / 180;
          const x = cx + e.r * Math.cos(ang);
          const y = cy + e.r * Math.sin(ang);
          const delta = ((sweep - e.a) % 360 + 360) % 360;
          const glow = Math.max(0, 1 - delta / 60);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={e.s + glow * 3} fill={C.red} opacity={0.25 + glow * 0.75} />
              <circle cx={x} cy={y} r={e.s + 8 + glow * 10} fill="none" stroke={C.red} strokeWidth={1} opacity={glow * 0.5} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
