import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, ARCHIVO, MONO } from "../theme";
import { ChapterCard } from "../components/Chapter";
import { MapStrait } from "../components/MapStrait";
import { SourceChip, CountUp } from "../components/SourceChip";
import { SlamLine, Fade } from "../components/Type";

const f = (s: number) => Math.round(s * 30);

const FlowBar: React.FC<{
  at: number;
  x: number;
  label: string;
  value: number;
  maxV: number;
  color: string;
  sub?: string;
}> = ({ at, x, label, value, maxV, color, sub }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 20, mass: 1.1 } });
  if (fr < at) return null;
  const h = 470 * (value / maxV) * Math.min(1, s);
  return (
    <div style={{ position: "absolute", left: x, bottom: 210, width: 250, textAlign: "center" }}>
      <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 66, color, marginBottom: 10 }}>
        {(value * Math.min(1, s)).toFixed(1)}
        <span style={{ fontSize: 24, color: C.dim }}> M b/d</span>
      </div>
      <div style={{ height: 480, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ width: 170, height: h, background: `linear-gradient(180deg, ${color} 0%, ${color}33 100%)`, border: `1px solid ${color}`, borderRadius: "6px 6px 0 0" }} />
      </div>
      <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: C.ink, marginTop: 14 }}>{label}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: 19, color: C.dim, marginTop: 6 }}>{sub}</div>}
    </div>
  );
};

export const Stakes: React.FC = () => {
  const fr = useCurrentFrame();
  const mapDim = interpolate(
    fr,
    [f(10.5), f(11.5), f(22), f(22.9), f(28.5), f(29.6)],
    [0, 0.62, 0.62, 0.35, 0.35, 0.85],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const mapOp = interpolate(fr, [f(29.0), f(30.0)], [1, 0.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ opacity: mapOp }}>
        <MapStrait showWidth={fr > f(6.6)} widthAt={f(6.73)} dim={mapDim * 0.6} />
        <AbsoluteFill style={{ background: `rgba(4,8,16,${mapDim * 0.55})` }} />
      </AbsoluteFill>

      <Fade at={f(1.97)} out={f(6.5)}>
        <div style={{ position: "absolute", top: 96, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: C.dim }}>
          CONNECTING THE PERSIAN GULF TO THE GULF OF OMAN
        </div>
      </Fade>

      <Sequence from={f(10.9)} durationInFrames={f(11.8)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
          {[
            { at: f(10.94), big: "25%", line: "of the world’s seaborne oil trade", d: 0 },
            { at: f(11.3), big: "20%", line: "of global liquefied natural gas", d: 1 },
          ].map((r) => (
            <Fade key={r.big} at={r.at} style={{ display: "flex", alignItems: "center", gap: 38 }}>
              <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 130, color: r.d ? C.teal : C.amber, width: 380, textAlign: "right" }}>{r.big}</span>
              <span style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 44, color: C.ink, maxWidth: 640 }}>{r.line}</span>
            </Fade>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <SourceChip label="SOURCE — INTERNATIONAL ENERGY AGENCY" delay={f(12)} />
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(22.4)} durationInFrames={f(7.4)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: C.dim, marginBottom: 10 }}>
            BEFORE THE WAR — FEBRUARY 28
          </div>
          <CountUp from={0} to={20} start={f(22.5)} dur={40} suffix=" M" size={170} color={C.ink} decimals={0} />
          <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 44, color: C.dim, textTransform: "uppercase" }}>
            barrels of oil a day, through one strait
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(29.8)} durationInFrames={f(6.6)}>
        <AbsoluteFill style={{ background: "rgba(120,10,16,0.32)", justifyContent: "center", alignItems: "center", padding: 120 }}>
          <AbsoluteFill style={{ border: `2px solid ${C.red}`, margin: 70, opacity: 0.5 }} />
          <SlamLine text="“The largest supply disruption" at={f(29.8)} size={88} weight={900} />
          <div style={{ height: 18 }} />
          <SlamLine text="in the history of the global oil market.”" at={f(31.1)} size={88} weight={900} color={C.red} />
          <div style={{ height: 34 }} />
          <SourceChip label="IEA — ON WHAT FOLLOWED" delay={f(32)} color={C.red} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(36.6)} durationInFrames={f(26)}>
        <AbsoluteFill>
          <Fade at={f(36.6)}>
            <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: C.dim }}>
              OIL FLOWS THROUGH THE STRAIT — MILLION BARRELS / DAY
            </div>
          </Fade>
          <FlowBar at={f(37.0)} x={390} label="PRE-WAR" value={20.0} maxV={20} color={C.teal} sub="February" />
          <FlowBar at={f(39.5)} x={835} label="AUGUST" value={7.2} maxV={20} color={C.red} />
          <FlowBar at={f(41.5)} x={1280} label="SEPTEMBER" value={10.9} maxV={20} color={C.amber} sub="+3.7 vs Aug" />
          <Fade at={f(48.3)} style={{ position: "absolute", top: 235, left: 0, right: 0, textAlign: "center" }}>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 52, color: C.ink }}>
              Recovered —{" "}
              <span style={{ color: C.red }}>but still only about half</span>{" "}
              of the pre-war level.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18 }}>
              <SourceChip label="IEA OIL MARKET REPORT · OCT 14" delay={f(49)} />
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(54.6)} durationInFrames={f(7.7)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "rgba(4,8,16,0.75)" }}>
          <SlamLine text="Why this story matters" at={f(54.9)} size={76} weight={900} />
          <div style={{ height: 14 }} />
          <SlamLine text="far beyond the Gulf." at={f(56.4)} size={76} weight={900} color={C.amber} />
          <Fade at={f(58)}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: C.dim, marginTop: 26, letterSpacing: 2 }}>
              FUEL AND SHIPPING COSTS EVERYWHERE ARE EXPOSED TO IT.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <ChapterCard kicker="PART ONE" title="THE STAKES" at={0} hold={48} />
    </AbsoluteFill>
  );
};
