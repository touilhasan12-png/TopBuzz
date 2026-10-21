import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, ARCHIVO, MONO } from "../theme";
import { ChapterCard } from "../components/Chapter";
import { SourceChip, CountUp } from "../components/SourceChip";
import { SlamLine, Fade } from "../components/Type";

const f = (s: number) => Math.round(s * 30);

const Side: React.FC<{
  at: number;
  side: "left" | "right";
  accent: string;
  nation: string;
  children: React.ReactNode;
  live: boolean;
}> = ({ at, side, accent, nation, children, live }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 24 } });
  if (fr < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 130,
        bottom: 60,
        [side]: 70,
        width: 860,
        opacity: Math.min(1, s * 1.3) * (live ? 1 : 0.25),
      }}
    >
      <div
        style={{
          borderTop: `5px solid ${accent}`,
          background: "rgba(7,12,22,0.88)",
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          height: "100%",
          padding: "30px 40px",
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: accent, marginBottom: 20 }}>{nation}</div>
        {children}
      </div>
    </div>
  );
};

export const TwoStatements: React.FC = () => {
  const fr = useCurrentFrame();
  const leftLive = fr < f(58);
  const rightAt = f(58.03);
  const rightLive = fr >= rightAt && fr < f(106);
  const splitOp = interpolate(fr, [f(106), f(107.5)], [1, 0.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Fade at={f(1.8)} out={f(5.2)}>
        <div style={{ position: "absolute", top: 100, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: C.dim }}>
          EXACTLY WHAT EACH SIDE IS SAYING
        </div>
      </Fade>

      <AbsoluteFill style={{ opacity: splitOp }}>
        <Fade at={f(5)}>
          <div style={{ position: "absolute", top: 120, bottom: 60, left: 958, width: 2, background: C.line }} />
        </Fade>

        <Side at={f(5.4)} side="left" accent={C.red} nation="IRAN" live={leftLive}>
          <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 62, color: C.ink, lineHeight: 1.1, textTransform: "uppercase" }}>
            “The strait is closed. Passage is prohibited.”
          </div>
          <div style={{ display: "flex", gap: 10, margin: "18px 0 8px" }}>
            <SourceChip label="IRGC NAVY · VIA IRNA" delay={f(6.2)} color={C.red} />
          </div>
          <Fade at={f(13.6)}>
            <div style={{ fontFamily: MONO, fontSize: 23, color: C.dim, lineHeight: 1.5, marginTop: 10 }}>
              + WARNING TO SHIPS AGAINST VIOLATING IRANIAN REGULATIONS
            </div>
          </Fade>
          <Fade at={f(17.46)}>
            <div style={{ marginTop: 26, border: `1px solid ${C.line}`, borderRadius: 6, padding: "20px 24px", background: "rgba(224,36,46,0.08)" }}>
              <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: C.red, marginBottom: 12 }}>
                THEIR DEFINITION OF “OPEN” — SPOKESMAN MOHEBBI
              </div>
              <div style={{ display: "flex", gap: 40, alignItems: "baseline" }}>
                <CountUp from={0} to={125} start={f(17.6)} size={66} color={C.ink} />
                <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim }}>SHIPS / DAY</span>
                <CountUp from={0} to={20} start={f(17.9)} size={66} color={C.ink} />
                <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim }}>M BARRELS / DAY</span>
              </div>
              <Fade at={f(26.86)}>
                <div style={{ fontFamily: MONO, fontSize: 22, color: C.amber, marginTop: 12 }}>
                  LEVELS NOT MET → ∴ “CLOSED”
                </div>
              </Fade>
            </div>
          </Fade>
          <Fade at={f(34.88)}>
            <div style={{ fontFamily: MONO, fontSize: 19, color: C.dim, marginTop: 20, lineHeight: 1.55 }}>
              NOT THE FIRST SUCH ANNOUNCEMENT — JMIC (47-NATION COMBINED MARITIME FORCES) RECORDED IT AGAIN.
            </div>
          </Fade>
        </Side>

        <Side at={rightAt} side="right" accent={C.blue} nation="UNITED STATES" live={rightLive}>
          <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 62, color: C.ink, lineHeight: 1.1, textTransform: "uppercase" }}>
            “The strait is open and available.”
          </div>
          <div style={{ display: "flex", gap: 10, margin: "18px 0 8px" }}>
            <SourceChip label="CAPT. TIM HAWKINS · CENTCOM" delay={f(58.6)} color={C.blue} />
          </div>
          <Fade at={f(72.14)}>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 34, color: C.dim, lineHeight: 1.35, marginTop: 14 }}>
              “Controlled by the United States and our regional partners — not Iran.”
            </div>
            <div style={{ fontFamily: MONO, fontSize: 19, color: C.dim, marginTop: 6 }}>— ADM. BRAD COOPER · DAY BEFORE</div>
          </Fade>
          <Fade at={f(81.85)}>
            <div style={{ marginTop: 22, border: `1px solid ${C.line}`, borderRadius: 6, padding: "20px 24px", background: "rgba(77,163,255,0.08)" }}>
              <div style={{ display: "flex", gap: 36, alignItems: "baseline" }}>
                <CountUp from={0} to={400} start={f(82)} size={66} color={C.ink} prefix="~" />
                <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim }}>MERCHANT SHIPS / 7 DAYS</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 21, color: C.dim, marginTop: 8 }}>
                + US FORCES HELPED GULF PARTNERS’ SHIPPING
              </div>
              <Fade at={f(90)}>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 54, color: C.blue, marginTop: 10 }}>
                  97% <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim, fontWeight: 400 }}>of pre-war traffic</span>
                </div>
              </Fade>
            </div>
          </Fade>
          <Fade at={f(96.03)}>
            <div style={{ fontFamily: MONO, fontSize: 20, color: C.amber, marginTop: 16, lineHeight: 1.55 }}>
              ⚠ 97% CAME WITH NO TIME WINDOW AND NO SHIP COUNT. THE SEVEN DAYS WERE NEVER BOUNDED.
            </div>
          </Fade>
        </Side>
      </AbsoluteFill>

      <Sequence from={f(106)} durationInFrames={f(6.8)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
          <SlamLine text="One way to read all this:" at={f(106.01)} size={66} weight={900} />
          <Fade at={f(112.73)}>
            <SourceChip label="THIS VIDEO’S READING — NOT EITHER SIDE’S" delay={f(112.73)} color={C.amber} />
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(115.7)} durationInFrames={f(9.4)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 26 }}>
          <div style={{ display: "flex", gap: 50 }}>
            <Fade at={f(115.79)} style={{ width: 760, border: `1px solid ${C.red}`, borderRadius: 8, padding: "28px 34px", background: "rgba(224,36,46,0.07)" }}>
              <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: C.red, marginBottom: 10 }}>IRAN’S “OPEN”</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 52, color: C.ink }}>= NORMAL</div>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 8 }}>normal traffic · normal volumes · no interference</div>
            </Fade>
            <Fade at={f(121.51)} style={{ width: 760, border: `1px solid ${C.blue}`, borderRadius: 8, padding: "28px 34px", background: "rgba(77,163,255,0.07)" }}>
              <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: C.blue, marginBottom: 10 }}>AMERICA’S “OPEN”</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 52, color: C.ink }}>= SHIPS GETTING THROUGH</div>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 8 }}>any ships, escorted or not</div>
            </Fade>
          </div>
          <Fade at={f(125.1)}>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 46, color: C.amber, letterSpacing: 2 }}>
              PART OF THE GAP IS DEFINITIONAL.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(127.7)} durationInFrames={f(8.6)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "rgba(4,8,16,0.8)", padding: 140 }}>
          <SlamLine text="But both also claim control of the water." at={f(127.75)} size={62} weight={700} />
          <div style={{ height: 16 }} />
          <SlamLine text="Definitions don’t settle that." at={f(131)} size={62} weight={900} color={C.red} />
        </AbsoluteFill>
      </Sequence>

      <ChapterCard kicker="PART TWO" title="TWO STATEMENTS" at={0} hold={48} />
    </AbsoluteFill>
  );
};
