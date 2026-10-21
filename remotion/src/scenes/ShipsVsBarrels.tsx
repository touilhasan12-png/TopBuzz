import React from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, ARCHIVO, MONO } from "../theme";
import { ChapterCard } from "../components/Chapter";
import { SourceChip } from "../components/SourceChip";
import { SlamLine, Fade } from "../components/Type";

const f = (s: number) => Math.round(s * 30);

const Barrels: React.FC<{ n: number; at: number; color?: string }> = ({ n, at, color = C.amber }) => {
  const fr = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: 520 }}>
      {Array.from({ length: n }, (_, i) => {
        const on = fr >= at + i * 2;
        return (
          <svg key={i} width="42" height="58" viewBox="0 0 42 58" style={{ opacity: on ? 1 : 0.12 }}>
            <rect x="2" y="4" width="38" height="50" rx="7" fill="none" stroke={color} strokeWidth="3" />
            <line x1="2" y1="18" x2="40" y2="18" stroke={color} strokeWidth="3" />
            <line x1="2" y1="40" x2="40" y2="40" stroke={color} strokeWidth="3" />
          </svg>
        );
      })}
    </div>
  );
};

export const ShipsVsBarrels: React.FC = () => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={f(2)} durationInFrames={f(10)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
          <SlamLine text="Ship counts are low." at={f(6.4)} size={90} weight={900} color={C.red} />
          <SlamLine text="Oil volumes are not." at={f(8.5)} size={90} weight={900} color={C.amber} />
          <Fade at={f(10.5)}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.dim, letterSpacing: 3 }}>THE WRINKLE THAT EXPLAINS HALF THE CONFUSION</div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(12)} durationInFrames={f(30)}>
        <AbsoluteFill>
          <Fade at={f(12.2)}>
            <div style={{ position: "absolute", top: 115, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: C.dim }}>
              HOW BARRELS MOVE WITHOUT “SHIPS IN THE STRAIT”
            </div>
          </Fade>
          <Fade at={f(12.35)} style={{ position: "absolute", top: 220, left: 150, width: 760 }}>
            <div style={{ border: `1px solid ${C.amber}`, borderRadius: 8, padding: "26px 30px", background: "rgba(232,163,61,0.06)" }}>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.amber, letterSpacing: 3, marginBottom: 10 }}>SHIP-TO-SHIP TRANSFERS</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 34, color: C.ink, lineHeight: 1.4 }}>
                Crude changes tankers offshore — most of it never crosses on one hull.
              </div>
              <div style={{ marginTop: 16 }}><Barrels n={10} at={f(13)} /></div>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim, marginTop: 12 }}>KPLER, VIA AFP · IEA ON SEPTEMBER’S 10.9M b/d</div>
            </div>
          </Fade>
          <Fade at={f(27.2)} style={{ position: "absolute", top: 220, right: 150, width: 760 }}>
            <div style={{ border: `1px solid ${C.teal}`, borderRadius: 8, padding: "26px 30px", background: "rgba(53,194,177,0.06)" }}>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.teal, letterSpacing: 3, marginBottom: 10 }}>PIPELINE BYPASS</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
                <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 96, color: C.ink }}>5.6</span>
                <span style={{ fontFamily: MONO, fontSize: 23, color: C.dim }}>MILLION BARRELS / DAY — AROUND THE STRAIT ENTIRELY</span>
              </div>
              <svg width="640" height="70" style={{ marginTop: 16 }}>
                <line x1="10" y1="35" x2="630" y2="35" stroke={C.teal} strokeWidth="8" strokeDasharray="26 18" strokeDashoffset={-((fr * 2) % 44)} />
              </svg>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim }}>IEA · BYPASS EXPORTS RECORD</div>
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(41)} durationInFrames={f(22)}>
        <AbsoluteFill>
          <Fade at={f(41.25)}>
            <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: C.red }}>
              AND THE DAILY NUMBERS SWING WILDLY
            </div>
          </Fade>
          {[
            { at: f(43.63), x: 420, v: 20.8, label: "OCT 8", color: C.amber },
            { at: f(45.5), x: 1020, v: 2.9, label: "DAYS LATER", color: C.red },
          ].map((b) => {
            const s = spring({ frame: fr - b.at, fps, config: { damping: 19 } });
            if (fr < b.at) return null;
            const h = 520 * (b.v / 20.8) * Math.min(1, s);
            return (
              <div key={b.label} style={{ position: "absolute", left: b.x, bottom: 240, width: 320, textAlign: "center" }}>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 92, color: b.color }}>
                  {(b.v * Math.min(1, s)).toFixed(1)}
                  <span style={{ fontSize: 30, color: C.dim }}>M b/d</span>
                </div>
                <div style={{ height: 540, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <div style={{ width: 220, height: h, background: `linear-gradient(180deg, ${b.color}, ${b.color}33)`, border: `1px solid ${b.color}`, borderRadius: "6px 6px 0 0" }} />
                </div>
                <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 12, letterSpacing: 3 }}>{b.label}</div>
              </div>
            );
          })}
          <Fade at={f(53.15)}>
            <div style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: 23, color: C.dim }}>
                CENTCOM: US FORCES HELPED SHIP <span style={{ color: C.blue, fontWeight: 600 }}>19M+ BARRELS</span> ON MONDAY, OCT 12 — A THIRD SOURCE, A THIRD WINDOW.
              </span>
            </div>
          </Fade>
          <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center" }}>
            <SourceChip label="KPLER · VIA AL JAZEERA" delay={f(44)} />
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(61.5)} durationInFrames={f(18.2)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 24, padding: 150 }}>
          <SlamLine text="Different definitions. Different windows." at={f(61.93)} size={62} weight={900} />
          <SlamLine text="Trust the weekly averages." at={f(66.5)} size={62} weight={900} color={C.teal} />
          <Fade at={f(72.05)}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.dim, textAlign: "center", lineHeight: 1.7, maxWidth: 1300 }}>
              ONE READING OF HOW LOW SHIP COUNTS AND BIG BARREL NUMBERS
              CAN SHARE THE SAME NEWS CYCLE.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <ChapterCard kicker="PART FIVE" title="SHIPS VS BARRELS" at={0} hold={44} />
    </AbsoluteFill>
  );
};
