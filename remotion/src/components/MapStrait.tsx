import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO, ARCHIVO } from "../theme";

/** Stylized documentary map of the Strait of Hormuz (procedural — no external tiles). */
export const MapStrait: React.FC<{
  showWidth?: boolean;
  showLanes?: boolean;
  widthAt?: number;
  dim?: number;
  scale?: number;
}> = ({ showWidth = false, showLanes = true, widthAt = 0, dim = 0, scale = 1 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame: f, fps, config: { damping: 26 } });
  const wS = spring({ frame: f - widthAt, fps, config: { damping: 18 } });
  const dash = (f * 1.2) % 40;

  const pN = { x: 1005, y: 415 };
  const pS = { x: 1035, y: 560 };

  const tankers = [0, 1, 2, 3, 4].map((i) => {
    const t = ((f * 0.55 + i * 160) % 800) / 800;
    return {
      x: 700 + t * 640,
      y: 620 - Math.sin(t * Math.PI) * 130 - i * 12,
      o: Math.sin(t * Math.PI),
    };
  });

  return (
    <AbsoluteFill>
      <svg width="1920" height="1080" style={{ position: "absolute", transform: `scale(${scale * (0.94 + inS * 0.06)})`, transformOrigin: "1000px 500px" }}>
        <rect x="0" y="0" width="1920" height="1080" fill="#081120" />
        <ellipse cx="560" cy="560" rx="500" ry="360" fill="#0B1A30" />
        <ellipse cx="1520" cy="820" rx="480" ry="320" fill="#0B1A30" />
        <path
          d="M0 0 H1920 V300 C1700 330 1600 300 1480 330 C1360 360 1280 430 1160 440 C1040 450 1000 420 940 400 C820 360 700 340 560 330 C400 318 200 300 0 320 Z"
          fill="#0E1A2B"
          stroke={C.line}
          strokeWidth={1.5}
        />
        <path
          d="M0 1080 V760 C260 720 430 700 620 700 C800 700 940 660 1010 590 C1060 540 1090 540 1150 570 C1260 625 1380 660 1520 700 C1700 750 1820 780 1920 800 V1080 Z"
          fill="#0E1A2B"
          stroke={C.line}
          strokeWidth={1.5}
        />
        <path d="M1000 560 C1020 520 1060 500 1090 520 C1070 570 1040 600 1010 620 Z" fill="#12233A" stroke={C.line} />
        <g fontFamily={MONO} fill={C.dim} fontSize={24} letterSpacing={6} opacity={0.9}>
          <text x="230" y="160">IRAN</text>
          <text x="330" y="500" fill={C.teal}>PERSIAN GULF</text>
          <text x="1460" y="900" fill={C.teal}>GULF OF OMAN</text>
          <text x="1240" y="760">OMAN · UAE</text>
        </g>
        <g opacity={inS}>
          <text x="1050" y="330" fontFamily={ARCHIVO} fontWeight={900} fontSize={34} fill={C.ink} letterSpacing={3}>
            STRAIT OF HORMUZ
          </text>
          <line x1="1052" y1="345" x2={pN.x + 14} y2={pN.y - 10} stroke={C.ink} strokeWidth={1.4} opacity={0.6} />
        </g>
        {showLanes && (
          <g stroke={C.teal} strokeWidth={2.4} fill="none" opacity={0.75}>
            <path d="M 640 640 C 820 610 980 520 1120 520 C 1260 520 1360 600 1460 660" strokeDasharray="14 12" strokeDashoffset={-dash} />
            <path d="M 660 690 C 840 660 1000 570 1140 570 C 1270 570 1370 640 1480 700" strokeDasharray="6 10" strokeDashoffset={dash} opacity={0.5} />
          </g>
        )}
        {showLanes &&
          tankers.map((t, i) => (
            <circle key={i} cx={t.x} cy={t.y} r={5} fill={C.amber} opacity={0.35 + t.o * 0.6} />
          ))}
        {showWidth && (
          <g opacity={Math.min(1, wS * 1.4)}>
            <line x1={pN.x} y1={pN.y} x2={pS.x} y2={pS.y} stroke={C.red} strokeWidth={3} />
            <line x1={pN.x - 16} y1={pN.y + 4} x2={pN.x + 16} y2={pN.y - 4} stroke={C.red} strokeWidth={3} />
            <line x1={pS.x - 16} y1={pS.y - 4} x2={pS.x + 16} y2={pS.y + 4} stroke={C.red} strokeWidth={3} />
            <rect x={pS.x + 30} y={(pN.y + pS.y) / 2 - 40} rx={6} width={330} height={86} fill="rgba(5,10,20,0.88)" stroke={C.line} />
            <text x={pS.x + 52} y={(pN.y + pS.y) / 2 + 14} fontFamily={ARCHIVO} fontWeight={900} fontSize={44} fill={C.ink}>
              35–40 KM
            </text>
            <text x={pS.x + 52} y={(pN.y + pS.y) / 2 + 34} fontFamily={MONO} fontSize={18} fill={C.dim} letterSpacing={2}>
              AT ITS NARROWEST
            </text>
          </g>
        )}
      </svg>
      {dim > 0 && <AbsoluteFill style={{ background: `rgba(4,8,16,${dim})` }} />}
    </AbsoluteFill>
  );
};
