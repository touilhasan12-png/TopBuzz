import React from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, ARCHIVO, MONO } from "../theme";
import { ChapterCard } from "../components/Chapter";
import { CountUp } from "../components/SourceChip";
import { SlamLine, Fade, GlitchTitle } from "../components/Type";

const f = (s: number) => Math.round(s * 30);

const Row: React.FC<{
  at: number; y: number; src: string; val: string; note: string; color?: string; big?: boolean;
}> = ({ at, y, src, val, note, color = C.ink, big }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 18, stiffness: 160 } });
  if (fr < at) return null;
  return (
    <div
      style={{
        position: "absolute", top: y, left: 180, right: 180,
        display: "flex", alignItems: "baseline", gap: 36,
        opacity: Math.min(1, s * 1.4), transform: `translateX(${(1 - s) * -50}px)`,
        borderBottom: `1px solid ${C.line}`, paddingBottom: 14,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim, width: 340, letterSpacing: 2 }}>{src}</span>
      <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: big ? 92 : 66, color, width: 300, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{val}</span>
      <span style={{ fontFamily: MONO, fontSize: 21, color: C.dim }}>{note}</span>
    </div>
  );
};

const DotGrid: React.FC<{ at: number; darkFrac?: number; cols?: number; rows?: number }> = ({
  at, darkFrac = 0.8, cols = 24, rows = 9,
}) => {
  const fr = useCurrentFrame();
  if (fr < at) return null;
  const t = fr - at;
  const dots = [];
  for (let i = 0; i < cols * rows; i++) {
    const h = ((i * 2654435761) % 1000) / 1000;
    const isDark = h < darkFrac;
    const blink = !isDark && (Math.floor(t / 20) + i) % 3 === 0;
    dots.push(
      <circle
        key={i}
        cx={180 + (i % cols) * 66}
        cy={200 + Math.floor(i / cols) * 66}
        r={isDark ? 6 : 8}
        fill={isDark ? "#1B2A40" : blink ? C.amber : C.teal}
        opacity={isDark ? 0.55 : 0.95}
      />
    );
  }
  return <svg width="1920" height="900" style={{ position: "absolute", top: 60 }}>{dots}</svg>;
};

export const Counting: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={f(2.3)} durationInFrames={f(9)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 18 }}>
          <SlamLine text="What’s actually happening on the water?" at={f(2.51)} size={72} weight={900} />
          <Fade at={f(5.67)}>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 46, color: C.amber }}>
              The numbers themselves disagree.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(11)} durationInFrames={f(33)}>
        <AbsoluteFill>
          <Fade at={f(11.27)}>
            <div style={{ position: "absolute", top: 105, left: 180, fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: C.teal }}>
              FIRST — WHAT’S NORMAL? <span style={{ color: C.dim }}>IT DEPENDS ON THE DATASET.</span>
            </div>
          </Fade>
          <Row at={f(14.9)} y={210} src="IMF PORTWATCH · via EconoFact" val="103" note="traditional vessels / day (average)" />
          <Row at={f(28.3)} y={350} src="REUTERS" val="125" note="large commercial vessels / day" />
          <Row at={f(31.5)} y={490} src="gCAPTAIN · 2025 avg" val="138" note="per day" />
          <Fade at={f(38)}>
            <div style={{ position: "absolute", top: 660, left: 180, fontFamily: ARCHIVO, fontWeight: 900, fontSize: 54, color: C.ink }}>
              Normal ≈ <span style={{ color: C.teal }}>100 – 140</span> ships a day.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(43.5)} durationInFrames={f(49)}>
        <AbsoluteFill>
          <Fade at={f(43.5)}>
            <div style={{ position: "absolute", top: 105, left: 180, fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: C.red }}>
              NOW — WHAT TRACKERS SEE
            </div>
          </Fade>
          <Fade at={f(45)}>
            <div style={{ position: "absolute", top: 190, left: 700, right: 300, height: 110, background: "rgba(53,194,177,0.10)", border: `1px dashed ${C.teal}`, borderRadius: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 20, color: C.teal, position: "absolute", top: 10, left: 16, letterSpacing: 2 }}>NORMAL BAND · 103–138 / DAY</span>
            </div>
          </Fade>
          {[
            { at: f(44.35), src: "KPLER", val: 7, note: "Oct 6 · commodity vessels · transponders-on only" },
            { at: f(55.77), src: "JMIC (draft)", val: 5, note: "single digits / day · Oct 8–14", txt: "~5" },
            { at: f(71.9), src: "WINDWARD", val: 12, note: "Oct 18 · 5 in / 7 out · 4 with signals off" },
          ].map((r) => {
            const y = 340 + [44.35, 55.77, 71.9].indexOf(r.at / 30) * 0; // computed below
            return null as never;
          })}
          {[
            { at: f(44.35), src: "KPLER", val: 7, note: "Oct 6 · commodity vessels · transponders-on only", y: 340 },
            { at: f(55.77), src: "JMIC (draft)", val: 5, note: "single digits / day · Oct 8–14", txt: "~5", y: 490 },
            { at: f(71.9), src: "WINDWARD", val: 12, note: "Oct 18 · 5 in / 7 out · 4 with signals off", y: 640 },
          ].map((r) => {
            const wN = 900 * (r.val / 140);
            return (
              <Fade key={r.src} at={r.at} style={{ position: "absolute", top: r.y, left: 180 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
                  <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim, width: 230, letterSpacing: 2 }}>{r.src}</span>
                  <div style={{ width: wN, height: 54, background: `linear-gradient(90deg, ${C.red}, ${C.red}88)`, borderRadius: 4 }} />
                  <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 60, color: C.ink }}>{r.txt ?? r.val}</span>
                  <span style={{ fontFamily: MONO, fontSize: 19, color: C.dim, maxWidth: 520 }}>{r.note}</span>
                </div>
              </Fade>
            );
          })}
          <Fade at={f(82.2)}>
            <div style={{ position: "absolute", top: 820, left: 180, right: 180, fontFamily: MONO, fontSize: 20, color: C.amber, lineHeight: 1.5 }}>
              ⚠ WINDWARD CAUTIONS: DARK-TRANSIT COUNTS CAN’T ALWAYS BE COMPARED ACROSS DATES — DETECTION VARIES.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(92)} durationInFrames={f(62)}>
        <AbsoluteFill>
          <Fade at={f(92.15)}>
            <div style={{ position: "absolute", top: 105, left: 180, fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: C.blue }}>
              THIRD — THE US COUNT
            </div>
          </Fade>
          <Fade at={f(94.15)}>
            <div style={{ position: "absolute", top: 185, left: 180, display: "flex", gap: 30, alignItems: "baseline" }}>
              <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 100, color: C.ink }}>121</span>
              <span style={{ fontFamily: MONO, fontSize: 23, color: C.dim, maxWidth: 560 }}>
                US-FACILITATED TRANSITS · OCT 11–14 (US NAVY GUIDANCE DATA) — ≈ 30 / DAY
              </span>
            </div>
          </Fade>
          <Fade at={f(120.37)}>
            <div style={{ position: "absolute", top: 360, left: 180 }}>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.teal, letterSpacing: 3, marginBottom: 14 }}>
                UKMTO WEEKLY OVERVIEW · OCT 16 (DATA THROUGH OCT 14)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                <div style={{ position: "relative", width: 940, height: 84 }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 940, background: "rgba(53,194,177,0.18)", border: `1px solid ${C.teal}`, borderRadius: 5 }} />
                  <Fade at={f(133.67)}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.round(940 * (42 / 254)), background: C.red, borderRadius: 5 }} />
                  </Fade>
                </div>
                <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 86, color: C.ink }}>254</span>
                <span style={{ fontFamily: MONO, fontSize: 21, color: C.dim, maxWidth: 300 }}>COMBINED TRANSITS · ≈70% OF NORMAL</span>
              </div>
              <Fade at={f(133.67)}>
                <div style={{ fontFamily: MONO, fontSize: 22, color: C.red, marginTop: 14 }}>
                  LOOK INSIDE: ONLY 42 OBSERVED THROUGH AIS.
                </div>
              </Fade>
              <Fade at={f(138.28)}>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim, marginTop: 12, lineHeight: 1.6, maxWidth: 1150 }}>
                  THE 121 US-FACILITATED FIGURE IS A SEPARATE DATASET UKMTO CAN’T INDEPENDENTLY VERIFY —
                  “RELATED BUT DISTINCT.”
                </div>
              </Fade>
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(146.5)} durationInFrames={f(48)}>
        <AbsoluteFill>
          <DotGrid at={f(147)} />
          <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(5,10,20,0.92) 26%, rgba(5,10,20,0.25) 60%, transparent)" }} />
          <div style={{ position: "absolute", left: 140, top: 120 }}>
            <GlitchTitle text="Why can’t anyone just count?" at={f(147.3)} size={64} />
          </div>
          <div style={{ position: "absolute", left: 140, top: 320 }}>
            <SlamLine text="Because of AIS." at={f(153.39)} size={86} color={C.red} weight={900} center={false} />
            <Fade at={f(154.6)}>
              <div style={{ fontFamily: MONO, fontSize: 24, color: C.dim, marginTop: 22, lineHeight: 1.7, maxWidth: 780 }}>
                SHIPS ARE SUPPOSED TO BROADCAST THEIR POSITION.<br />
                IN THIS PART OF THE WORLD, MANY DON’T —<br />
                JMIC: BROADCASTING AIS MEANS A HIGHER RISK OF BEING TARGETED.
              </div>
            </Fade>
            <Fade at={f(167.75)}>
              <div style={{ display: "flex", gap: 26, alignItems: "baseline", marginTop: 34 }}>
                <CountUp from={0} to={23000} start={f(167.75)} dur={55} size={86} color={C.amber} />
                <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim, maxWidth: 420 }}>
                  ANOMALOUS AIS POSITIONS LOGGED BY UKMTO IN A SINGLE WEEK
                </span>
              </div>
            </Fade>
            <Fade at={f(184.67)}>
              <div style={{ display: "flex", gap: 26, alignItems: "baseline", marginTop: 26 }}>
                <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 86, color: C.teal }}>521</span>
                <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim }}>RADIO TRANSMISSIONS (MAY 8 SNAPSHOT)</span>
                <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 86, color: C.red }}>84</span>
                <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim }}>MATCHED AN AIS SIGNAL</span>
              </div>
            </Fade>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(194.2)} durationInFrames={f(24)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 160 }}>
          <Fade at={f(194.42)} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 44, color: C.ink, lineHeight: 1.4, maxWidth: 1300 }}>
              One analyst says the US operational count “plausibly includes”
              every vessel it helped — escorted or not.
            </div>
            <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 14 }}>
              EIRIK HOOPER · DREWRY — VIA AL JAZEERA
            </div>
            <div style={{ marginTop: 34, display: "inline-block", border: `2px solid ${C.amber}`, borderRadius: 8, padding: "18px 40px" }}>
              <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 42, color: C.amber, letterSpacing: 2 }}>
                AN INFERENCE — A HYPOTHESIS. NOT A FINDING.
              </span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim, marginTop: 18 }}>
              NO OTHER SOURCE IN THIS VIDEO CONFIRMS IT.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(218.5)} durationInFrames={f(11.7)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 26 }}>
          <Fade at={f(218.6)}>
            <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: C.dim, marginBottom: 8 }}>
              THE HONEST TAKEAWAY — WHEN YOU SEE A NUMBER ABOUT HORMUZ, ASK:
            </div>
          </Fade>
          {[
            { at: f(224.94), q: "WHICH SHIPS ARE COUNTED?" },
            { at: f(226.74), q: "OVER WHAT WINDOW?" },
            { at: f(228.03), q: "AND HOW DOES THE SOURCE KNOW?" },
          ].map((r, i) => (
            <div key={r.q} style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <span style={{ fontFamily: MONO, fontSize: 30, color: C.red }}>0{i + 1}</span>
              <SlamLine text={r.q} at={r.at} size={58} weight={900} />
            </div>
          ))}
        </AbsoluteFill>
      </Sequence>

      <ChapterCard kicker="PART THREE" title="THE COUNTING PROBLEM" at={0} hold={48} />
    </AbsoluteFill>
  );
};
