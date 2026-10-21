import React from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, ARCHIVO, MONO } from "../theme";
import { ChapterCard } from "../components/Chapter";
import { SlamLine, Fade, GlitchTitle } from "../components/Type";

const f = (s: number) => Math.round(s * 30);

const Door: React.FC<{
  at: number; x: number; title: string; question: string; verdict: string; vColor: string; detail: string; detailAt: number;
}> = ({ at, x, title, question, verdict, vColor, detail, detailAt }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 18, stiffness: 140 } });
  if (fr < at) return null;
  return (
    <div
      style={{
        position: "absolute", top: 220, left: x, width: 500,
        border: `1px solid ${C.line}`, borderTop: `5px solid ${vColor}`, borderRadius: 8,
        background: "rgba(7,12,22,0.9)", padding: "26px 30px",
        opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 40}px)`,
      }}
    >
      <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 44, color: C.ink, textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontFamily: MONO, fontSize: 21, color: C.dim, marginTop: 12, lineHeight: 1.55, minHeight: 100 }}>{question}</div>
      <Fade at={detailAt}>
        <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim, lineHeight: 1.55, minHeight: 130 }}>{detail}</div>
        <div style={{ marginTop: 14, display: "inline-block", border: `2px solid ${vColor}`, borderRadius: 6, padding: "10px 26px" }}>
          <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 34, color: vColor, letterSpacing: 1 }}>{verdict}</span>
        </div>
      </Fade>
    </div>
  );
};

const Gauge: React.FC<{ at: number; x: number; label: string; value: number; color: string }> = ({ at, x, label, value, color }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 22 } });
  if (fr < at) return null;
  return (
    <div style={{ position: "absolute", top: 600, left: x, width: 460, textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: C.dim, marginBottom: 14 }}>{label}</div>
      <div style={{ height: 26, border: `1px solid ${C.line}`, borderRadius: 13, overflow: "hidden" }}>
        <div style={{ width: `${value * Math.min(1, s)}%`, height: "100%", background: `linear-gradient(90deg, ${color}66, ${color})`, borderRadius: 13 }} />
      </div>
    </div>
  );
};

export const Meaning: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={f(3)} durationInFrames={f(60)}>
        <AbsoluteFill>
          <Fade at={f(5.21)}>
            <div style={{ position: "absolute", top: 105, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: C.dim }}>
              THERE ARE THREE WAYS TO BE CLOSED
            </div>
          </Fade>
          <Door
            at={f(7.82)} x={130}
            title="Legally" vColor={C.amber}
            question="Does one nation’s word make law on the water?"
            verdict="CONTESTED"
            detailAt={f(13.47)}
            detail="JMIC (July): no single nation controls the strait. Iran claims a security right to restrict. Neither ratified UNCLOS."
          />
          <Door
            at={f(21.21)} x={710}
            title="Physically" vColor={C.teal}
            question="Can a ship get through?"
            verdict="NO — NOT CLOSED"
            detailAt={f(24.41)}
            detail="Yes. Some do, every day: ~30 by the US count, a dozen or fewer by independent trackers. No source reports zero."
          />
          <Door
            at={f(35.19)} x={1290}
            title="Commercially" vColor={C.red}
            question="Will ordinary owners send ordinary cargoes — at ordinary cost?"
            verdict="MOSTLY YES"
            detailAt={f(41.59)}
            detail="UKMTO: traffic ≈70% below pre-war. ~430 ships at anchor off the UAE & Oman (JMIC). September flows: barely half of pre-war (IEA)."
          />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(58)} durationInFrames={f(22)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 22, padding: 150 }}>
          <div style={{ display: "flex", gap: 40 }}>
            <Fade at={f(60.64)} style={{ width: 740, border: `1px solid ${C.red}`, borderRadius: 8, padding: "20px 28px", background: "rgba(224,36,46,0.06)" }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.red, letterSpacing: 4, marginBottom: 8 }}>IRAN’S STATEMENT LEANS ON</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 38, color: C.ink }}>“COMMERCIAL” + A CLAIM TO AUTHORITY</div>
            </Fade>
            <Fade at={f(68.75)} style={{ width: 740 }}>
              <div style={{ border: `1px solid ${C.blue}`, borderRadius: 8, padding: "20px 28px", background: "rgba(77,163,255,0.06)", height: "100%" }}>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.blue, letterSpacing: 4, marginBottom: 8 }}>THE US STATEMENT LEANS ON</div>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 38, color: C.ink }}>“PHYSICAL” + THE ABILITY TO HELP SHIPS THROUGH</div>
              </div>
            </Fade>
          </div>
          <Fade at={f(74.52)}>
            <div style={{ fontFamily: MONO, fontSize: 22, color: C.amber, letterSpacing: 2 }}>AND BOTH CLAIM CONTROL OF THE SAME WATER.</div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(78.5)} durationInFrames={f(12)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 26, background: "rgba(4,8,16,0.6)" }}>
          <SlamLine text="A strait doesn’t close like a door." at={f(79.06)} size={78} weight={900} color={C.dim} />
          <GlitchTitle text="It closes like a market:" at={f(81.65)} size={96} />
          <div style={{ display: "flex", gap: 34 }}>
            <SlamLine text="FEAR" at={f(84)} size={62} color={C.red} weight={900} />
            <SlamLine text="PRICE" at={f(85.2)} size={62} color={C.amber} weight={900} />
            <SlamLine text="PERMISSION" at={f(86.4)} size={62} color={C.blue} weight={900} />
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(90)} durationInFrames={f(27)}>
        <AbsoluteFill>
          <Fade at={f(90.5)}>
            <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", fontFamily: ARCHIVO, fontWeight: 900, fontSize: 56, color: C.ink }}>
              Right now, <span style={{ color: C.red }}>no declaration controls all three.</span>
            </div>
          </Fade>
          <Gauge at={f(93)} x={220} label="FEAR" value={86} color={C.red} />
          <Gauge at={f(94.5)} x={730} label="PRICE" value={72} color={C.amber} />
          <Gauge at={f(96)} x={1240} label="PERMISSION" value={58} color={C.blue} />

          <Fade at={f(98)}>
            <div style={{ position: "absolute", top: 730, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: C.dim }}>
              WHAT SHOULD YOU WATCH?
            </div>
          </Fade>
          {[
            { at: f(92.78), t: "UKMTO WEEKLY OVERVIEW — PUBLISHED FRIDAYS" },
            { at: f(96.13), t: "JMIC THREAT LEVEL" },
            { at: f(97.65), t: "WAR-RISK INSURANCE QUOTES" },
            { at: f(99.59), t: "THE IEA’S MONTHLY REPORT" },
            { at: f(101.47), t: "AND DIPLOMACY" },
          ].map((w, i) => (
            <Fade key={w.t} at={w.at} style={{ position: "absolute", top: 790 + i * 38, left: 0, right: 0, textAlign: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: 24, color: i === 4 ? C.amber : C.ink, letterSpacing: 2 }}>
                ▸ {w.t}
              </span>
            </Fade>
          ))}
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(101)} durationInFrames={f(40.9)}>
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 120 }}>
          <Fade at={f(102.55)} style={{ maxWidth: 1350, textAlign: "center" }}>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 40, color: C.ink, lineHeight: 1.45 }}>
              Oct 8 — President Trump: the US would not attack Iran before the November 3rd midterms.
            </div>
            <Fade at={f(116.46)}>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 40, color: C.ink, marginTop: 26, lineHeight: 1.45 }}>
                Tehran: a formal reply to the US counterproposal “within days”.
              </div>
            </Fade>
          </Fade>
          <Fade at={f(124.02)} style={{ marginTop: 60 }}>
            <div style={{ border: `2px solid ${C.red}`, borderRadius: 10, padding: "30px 60px", textAlign: "center", background: "rgba(5,10,20,0.9)" }}>
              <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: C.red, marginBottom: 14 }}>AS OF OCTOBER 18, 2026</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 54, color: C.ink }}>No agreement had been announced.</div>
            </div>
          </Fade>
          <Fade at={f(135.55)} style={{ marginTop: 40 }}>
            <div style={{ fontFamily: MONO, fontSize: 23, color: C.dim, letterSpacing: 2, textAlign: "center", lineHeight: 1.9 }}>
              THIS SITUATION IS CHANGING DAY BY DAY.<br />
              SOURCES FOR EVERY FIGURE — IN THE DESCRIPTION.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <ChapterCard kicker="PART SIX" title={'SO WHAT DOES "CLOSED" MEAN?'} at={0} hold={50} />
    </AbsoluteFill>
  );
};
