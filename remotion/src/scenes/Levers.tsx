import React from "react";
import { AbsoluteFill, Sequence, OffthreadVideo, staticFile } from "remotion";
import { C, ARCHIVO, MONO } from "../theme";
import { ChapterCard } from "../components/Chapter";
import { SourceChip } from "../components/SourceChip";
import { SlamLine, Fade, GlitchTitle } from "../components/Type";
import { BRoll } from "../components/FilmGrade";

const f = (s: number) => Math.round(s * 30);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ASSETS = require("../data/assets.gen.json");

const LEV = [
  { n: 1, t: 12.67, name: "LAW & DECLARATION" },
  { n: 2, t: 63.21, name: "WEAPONS" },
  { n: 3, t: 138.27, name: "MINES" },
  { n: 4, t: 217.91, name: "INSURANCE" },
  { n: 5, t: 270.99, name: "PERMITS & FEES" },
  { n: 6, t: 333.94, name: "VISIBILITY" },
  { n: 7, t: 361.68, name: "NAVAL FACILITATION" },
];

const LeverStrip: React.FC = () => {
  const fr = (0 + (globalThis as any).__rf) || 0;
  return null as never;
};

const Strip: React.FC<{ curT: number }> = ({ curT }) => (
  <div style={{ position: "absolute", left: 90, right: 90, bottom: 40, display: "flex", gap: 10 }}>
    {LEV.map((l) => {
      const active = curT >= l.t && (l.n === 7 || curT < LEV[l.n].t);
      const past = curT >= (LEV[l.n]?.t ?? 1e9);
      return (
        <div
          key={l.n}
          style={{
            flex: 1,
            borderTop: `4px solid ${active ? C.red : past ? C.dim : "#23324a"}`,
            paddingTop: 8,
            opacity: active ? 1 : past ? 0.75 : 0.4,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 15, color: active ? C.red : C.dim, letterSpacing: 1 }}>
            L{l.n} · {l.name}
          </div>
        </div>
      );
    })}
  </div>
);

import { useCurrentFrame } from "remotion";
const LeverStripLive: React.FC = () => {
  const fr = useCurrentFrame();
  return <Strip curT={fr / 30} />;
};

const LeverHead: React.FC<{ at: number; n: number; name: string; hint?: string }> = ({ at, n, name, hint }) => (
  <div style={{ position: "absolute", top: 96, left: 120 }}>
    <GlitchTitle text={`LEVER ${n}`} at={at} size={40} color={C.red} />
    <SlamLine text={name} at={at + 5} size={84} weight={900} center={false} />
    {hint && (
      <Fade at={at + 20}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: C.dim, marginTop: 12, letterSpacing: 1, maxWidth: 900 }}>{hint}</div>
      </Fade>
    )}
  </div>
);

const Hero: React.FC<{ file: string; photo: string; dark?: number }> = ({ file, photo, dark = 0.6 }) => {
  if (ASSETS.heroes && ASSETS.heroes[file]) {
    return (
      <AbsoluteFill>
        <OffthreadVideo src={staticFile(`heroes/${file}`)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) contrast(1.05)" }} />
        <AbsoluteFill style={{ background: `rgba(4,8,16,${dark})` }} />
      </AbsoluteFill>
    );
  }
  if (ASSETS.photos && ASSETS.photos[photo]) return <BRoll src={`photos/${photo}`} dark={dark} />;
  return <AbsoluteFill style={{ background: "radial-gradient(90% 90% at 50% 40%, #0B1830 0%, #050A14 100%)" }} />;
};

const Verdict: React.FC<{ at: number; text: string; color?: string }> = ({ at, text, color = C.amber }) => (
  <Fade at={at} style={{ position: "absolute", bottom: 150, left: 120, right: 120 }}>
    <div style={{ display: "inline-block", border: `2px solid ${color}`, borderRadius: 8, padding: "16px 34px", background: "rgba(5,10,20,0.85)" }}>
      <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 40, color, letterSpacing: 1 }}>{text}</span>
    </div>
  </Fade>
);

export const Levers: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={f(1.8)} durationInFrames={f(10)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 22 }}>
          <SlamLine text="A strait isn’t a door." at={f(1.8)} size={92} weight={900} />
          <SlamLine text="It doesn’t close with one handle." at={f(3.46)} size={80} weight={900} color={C.dim} />
          <Fade at={f(5.91)}>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 60, color: C.red, marginTop: 18 }}>
              It has SEVEN LEVERS.
            </div>
          </Fade>
          <Fade at={f(9.58)}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.dim }}>SOME SIT WITH GOVERNMENTS. SOME DON’T.</div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      {/* L1 — LAW & DECLARATION · 12.67–63.21 */}
      <Sequence from={f(12.67)} durationInFrames={f(50.54)}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #050A14 0%, #091324 100%)" }}>
          <LeverHead at={f(12.67)} n={1} name="LAW & DECLARATION" hint="UNCLOS: SHIPS HOLD A RIGHT OF “TRANSIT PASSAGE” THROUGH STRAITS LIKE HORMUZ." />
          <Fade at={f(26.21)} style={{ position: "absolute", top: 430, left: 120 }}>
            <div style={{ display: "flex", gap: 18 }}>
              <div style={{ border: `1px solid ${C.red}`, borderRadius: 6, padding: "14px 26px", fontFamily: MONO, fontSize: 24, color: C.red }}>IRAN — NEVER RATIFIED UNCLOS</div>
              <div style={{ border: `1px solid ${C.blue}`, borderRadius: 6, padding: "14px 26px", fontFamily: MONO, fontSize: 24, color: C.blue }}>UNITED STATES — NEVER RATIFIED UNCLOS</div>
            </div>
          </Fade>
          <Fade at={f(31.53)} style={{ position: "absolute", top: 520, left: 120, fontFamily: MONO, fontSize: 22, color: C.dim, maxWidth: 1250, lineHeight: 1.6 }}>
            EXPERTS TREAT THE CORE RULES AS CUSTOMARY INTERNATIONAL LAW (REUTERS). IRAN ARGUES OTHERWISE.
          </Fade>
          <Fade at={f(42.19)} style={{ position: "absolute", top: 630, left: 120, right: 120, display: "flex", gap: 26 }}>
            <div style={{ flex: 1, border: `1px solid ${C.teal}`, borderRadius: 8, padding: "22px 26px", background: "rgba(53,194,177,0.06)" }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.teal, letterSpacing: 3, marginBottom: 8 }}>JMIC · JULY ADVISORY</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 30, color: C.ink, lineHeight: 1.35 }}>
                “Not subject to coercion or control by any single nation.”
              </div>
            </div>
            <div style={{ flex: 1, border: `1px solid ${C.red}`, borderRadius: 8, padding: "22px 26px", background: "rgba(224,36,46,0.06)" }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.red, letterSpacing: 3, marginBottom: 8 }}>TEHRAN</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 30, color: C.ink, lineHeight: 1.35 }}>
                “National security and self-defense in wartime.”
              </div>
            </div>
          </Fade>
          <Verdict at={f(55.72)} text="A declaration stops zero ships — it changes what happens if one tries." />
        </AbsoluteFill>
      </Sequence>

      {/* L2 — WEAPONS · 63.21–138.27 */}
      <Sequence from={f(63.21)} durationInFrames={f(75.06)}>
        <AbsoluteFill>
          <Hero file="h3_tanker.mp4" photo="iran_boat.jpg" dark={0.72} />
          <LeverHead at={f(64)} n={2} name="WEAPONS" hint="THE LEVER WITH THE MOST IMMEDIATE EFFECT — THIS VIDEO’S JUDGMENT." />
          <div style={{ position: "absolute", top: 420, left: 120, display: "flex", gap: 60 }}>
            <Fade at={f(70.71)}>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 130, color: C.ink }}>
                12 <span style={{ fontSize: 34, color: C.dim }}>ATTACKS / WEEK</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.amber, marginTop: 4 }}>10 OF THEM INSIDE THE STRAIT — UKMTO</div>
            </Fade>
            <Fade at={f(76.69)}>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 130, color: C.ink }}>
                149 <span style={{ fontSize: 34, color: C.dim }}>INCIDENTS</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 4 }}>CONFIRMED SINCE MARCH 1 — JMIC</div>
            </Fade>
            <Fade at={f(89.17)}>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 130, color: C.red }}>
                24 <span style={{ fontSize: 34, color: C.dim }}>SEAFARERS</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 4 }}>KILLED — IMO HIGHLIGHTED INCIDENTS</div>
            </Fade>
          </div>
          <Fade at={f(102.74)} style={{ position: "absolute", top: 700, left: 120 }}>
            <div style={{ display: "inline-block", border: `1px solid ${C.amber}`, borderRadius: 6, padding: "12px 22px", fontFamily: MONO, fontSize: 22, color: C.amber, marginRight: 14 }}>
              UKMTO ENTRIES MOSTLY READ: “UNKNOWN PROJECTILE”
            </div>
            <span style={{ display: "inline-block", border: `1px solid ${C.blue}`, borderRadius: 6, padding: "12px 22px", fontFamily: MONO, fontSize: 22, color: C.blue }}>
              CENTCOM: CONTAINER SHIP GFS PRIDE WAS HIT
            </span>
          </Fade>
          <Verdict at={f(114.26)} text="Fear needs no blockade." color={C.red} />
        </AbsoluteFill>
      </Sequence>

      {/* L3 — MINES · 138.27–217.91 */}
      <Sequence from={f(138.27)} durationInFrames={f(79.64)}>
        <AbsoluteFill>
          <Hero file="h2_mine.mp4" photo="mine.jpg" dark={0.74} />
          <LeverHead at={f(139.21)} n={3} name="MINES" />
          <Fade at={f(145.63)} style={{ position: "absolute", top: 380, left: 120, maxWidth: 1150 }}>
            <div style={{ borderLeft: `5px solid ${C.amber}`, background: "rgba(7,12,22,0.88)", padding: "20px 28px", borderRadius: "0 8px 8px 0" }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.amber, letterSpacing: 3, marginBottom: 6 }}>1987 · OPERATION EARNEST WILL</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 34, color: C.ink }}>
                The supertanker <span style={{ color: C.amber }}>BRIDGETON</span> struck a mine — during the first US-escorted convoy.
              </div>
            </div>
          </Fade>
          <Fade at={f(153.8)} style={{ position: "absolute", top: 560, left: 120, fontFamily: MONO, fontSize: 22, color: C.dim, maxWidth: 1150, lineHeight: 1.6 }}>
            ADM. COOPER (LATE AUG): US FORCES CLEARED THE MAIN LANES. JMIC STILL WARNS OF POSSIBLE MINING IN AND AROUND THE TRADITIONAL LANES.
          </Fade>
          <Fade at={f(172.23)} style={{ position: "absolute", top: 660, left: 120, right: 120, display: "flex", gap: 26 }}>
            <div style={{ flex: 1.2, border: `1px solid ${C.red}`, borderRadius: 8, padding: "20px 26px", background: "rgba(224,36,46,0.07)" }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.red, letterSpacing: 3, marginBottom: 8 }}>IRAN SAYS</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 28, color: C.ink, lineHeight: 1.4 }}>
                Oct 17: two tankers hit mines on an unauthorized route. In August: a large tanker hit two mines on the southern route.
              </div>
            </div>
            <Fade at={f(196.83)} style={{ flex: 1 }}>
              <div style={{ border: `1px solid ${C.blue}`, borderRadius: 8, padding: "20px 26px", background: "rgba(77,163,255,0.07)", height: "100%" }}>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.blue, letterSpacing: 3, marginBottom: 8 }}>CENTCOM ANSWERS</div>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 34, color: C.ink }}>
                  “No ship was struck by mines.” — the claim is false.
                </div>
              </div>
            </Fade>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      {/* L4 — INSURANCE · 217.91–270.99 */}
      <Sequence from={f(217.91)} durationInFrames={f(53.08)}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #050A14 0%, #0A1226 100%)" }}>
          <LeverHead at={f(218.76)} n={4} name="INSURANCE" hint="LLOYD’S: COVER NEVER DISAPPEARED — MASTERS AND OWNERS JUDGED THE RISK TOO HIGH." />
          <Fade at={f(239.21)} style={{ position: "absolute", top: 440, left: 120, fontFamily: ARCHIVO, fontWeight: 900, fontSize: 64, color: C.ink }}>
            But the price moved.
          </Fade>
          <div style={{ position: "absolute", top: 540, left: 120, right: 120 }}>
            <Fade at={f(240.69)}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 30 }}>
                <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 96, color: C.teal }}>0.25%</span>
                <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim, maxWidth: 380 }}>WAR-RISK PREMIUM, PRE-WAR — % OF SHIP’S VALUE (THE NATIONAL)</span>
              </div>
            </Fade>
            <Fade at={f(248.91)}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 30, marginTop: 18 }}>
                <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 96, color: C.red }}>7.5–10%</span>
                <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim, maxWidth: 460 }}>ADDITIONAL WAR-RISK PREMIUM BY JULY — MARSH EXECUTIVE, VIA S&P GLOBAL</span>
              </div>
            </Fade>
            <Fade at={f(257.49)}>
              <div style={{ fontFamily: MONO, fontSize: 26, color: C.amber, marginTop: 26, letterSpacing: 1 }}>
                ON A $100M TANKER → $7.5–10 MILLION. PER VOYAGE.
              </div>
            </Fade>
            <Fade at={f(265.6)}>
              <div style={{ fontFamily: MONO, fontSize: 19, color: C.dim, marginTop: 14 }}>
                JULY SNAPSHOT — RATES REPRICE CONSTANTLY. NOT TODAY’S PRICE.
              </div>
            </Fade>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* L5 — PERMITS & FEES · 270.99–333.94 */}
      <Sequence from={f(270.99)} durationInFrames={f(62.95)}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #050A14 0%, #0A1424 100%)" }}>
          <LeverHead at={f(271.8)} n={5} name="PERMITS & FEES" hint="SINCE MAY: IRAN’S “PERSIAN GULF STRAIT AUTHORITY” RUNS A PERMIT SYSTEM." />
          <Fade at={f(279.74)} style={{ position: "absolute", top: 440, left: 120 }}>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, background: "rgba(7,12,22,0.9)", padding: "20px 28px", fontFamily: MONO, fontSize: 22, color: C.ink, lineHeight: 1.7, maxWidth: 900 }}>
              <span style={{ color: C.dim }}>APPLICATION:</span> SUBMITTED BY EMAIL.<br />
              <span style={{ color: C.dim }}>ROUTING:</span> DIRECTED TO A LANE NEAR IRAN’S COAST.
            </div>
          </Fade>
          <Fade at={f(285.4)} style={{ position: "absolute", top: 620, left: 120 }}>
            <div style={{ display: "inline-block", border: `1px solid ${C.amber}`, borderRadius: 6, padding: "14px 24px", fontFamily: MONO, fontSize: 22, color: C.amber, lineHeight: 1.5, maxWidth: 1050 }}>
              IRANIAN LAWMAKER ON STATE TV (MARCH): SOME SHIPS CHARGED $2,000,000. — NO INDEPENDENT CONFIRMATION IN OUR SOURCES.
            </div>
          </Fade>
          <Fade at={f(297.72)} style={{ position: "absolute", top: 740, left: 120, right: 120, display: "flex", gap: 24 }}>
            <div style={{ flex: 1, border: `1px solid ${C.blue}`, borderRadius: 8, padding: "18px 24px", background: "rgba(77,163,255,0.06)" }}>
              <div style={{ fontFamily: MONO, fontSize: 19, color: C.blue, letterSpacing: 2, marginBottom: 6 }}>US TREASURY · MAY 27</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 26, color: C.ink, lineHeight: 1.35 }}>Sanctioned the authority — tolls “illegitimate”.</div>
            </div>
            <Fade at={f(307.68)} style={{ flex: 1 }}>
              <div style={{ border: `1px solid ${C.blue}`, borderRadius: 8, padding: "18px 24px", background: "rgba(77,163,255,0.06)", height: "100%" }}>
                <div style={{ fontFamily: MONO, fontSize: 19, color: C.blue, letterSpacing: 2, marginBottom: 6 }}>PRESIDENT TRUMP · JULY</div>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 26, color: C.ink, lineHeight: 1.35 }}>US would charge a 20% fee on strait cargo.</div>
              </div>
            </Fade>
            <Fade at={f(319.87)} style={{ flex: 1 }}>
              <div style={{ border: `1px solid ${C.teal}`, borderRadius: 8, padding: "18px 24px", background: "rgba(53,194,177,0.06)", height: "100%" }}>
                <div style={{ fontFamily: MONO, fontSize: 19, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>JMIC · JULY</div>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 26, color: C.ink, lineHeight: 1.35 }}>No controlling authority. No fee required.</div>
              </div>
            </Fade>
          </Fade>
          <Verdict at={f(328.15)} text="Two rival sets of rules. A different risk with each." />
        </AbsoluteFill>
      </Sequence>

      {/* L6 — VISIBILITY · 333.94–361.68 */}
      <Sequence from={f(333.94)} durationInFrames={f(27.74)}>
        <AbsoluteFill style={{ background: "radial-gradient(80% 80% at 50% 45%, #0A1830 0%, #050A14 90%)" }}>
          <LeverHead at={f(334.68)} n={6} name="VISIBILITY" hint="THIS ONE IS ALMOST INVISIBLE." />
          <Fade at={f(337.58)} style={{ position: "absolute", top: 470, left: 120, right: 120, display: "flex", gap: 26 }}>
            <div style={{ flex: 1, border: `1px solid ${C.teal}`, borderRadius: 8, padding: "22px 28px", background: "rgba(53,194,177,0.06)" }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.teal, letterSpacing: 3, marginBottom: 8 }}>JMIC</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 30, color: C.ink, lineHeight: 1.4 }}>
                Broadcast AIS → higher risk of being targeted — and ships get hailed toward Iran’s northern route.
              </div>
            </div>
            <Fade at={f(347.75)} style={{ flex: 1 }}>
              <div style={{ border: `1px solid ${C.red}`, borderRadius: 8, padding: "22px 28px", background: "rgba(224,36,46,0.06)", height: "100%" }}>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.red, letterSpacing: 3, marginBottom: 8 }}>IRGC NAVAL COMMANDER · THIS WEEK</div>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 30, color: C.ink, lineHeight: 1.4 }}>
                  Vessels that deactivate navigation systems would face consequences.
                </div>
              </div>
            </Fade>
          </Fade>
          <Verdict at={f(356.97)} text="Risk — whether you are seen, or not." color={C.red} />
        </AbsoluteFill>
      </Sequence>

      {/* L7 — NAVAL FACILITATION · 361.68–426.96 */}
      <Sequence from={f(361.68)} durationInFrames={f(65.3)}>
        <AbsoluteFill>
          <Hero file="h5_convoy.mp4" photo="convoy.jpg" dark={0.74} />
          <LeverHead at={f(363.01)} n={7} name="NAVAL FACILITATION" hint="NOT “CLASSIC ESCORTS” — THE WORDS ARE “ASSISTED” AND “COORDINATED PROTECTION.”" />
          <Fade at={f(368.74)} style={{ position: "absolute", top: 450, left: 120, maxWidth: 900 }}>
            <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, lineHeight: 1.7 }}>
              ROUTE GUIDANCE FROM A US NAVY CELL — MOST OF IT ALONG A SOUTHERN LANE HUGGING OMAN’S COAST.
            </div>
          </Fade>
          <Fade at={f(385.35)} style={{ position: "absolute", top: 570, left: 120, display: "flex", gap: 26, alignItems: "baseline" }}>
            <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 110, color: C.ink }}>135</span>
            <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim, maxWidth: 360 }}>VESSELS REDIRECTED — US BLOCKADE OF IRAN-LINKED SHIPPING</span>
            <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 110, color: C.red }}>4</span>
            <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim }}>DISABLED (OCT 10–11 · JMIC/CENTCOM)</span>
          </Fade>
          <Fade at={f(399.91)} style={{ position: "absolute", top: 760, left: 120, right: 120 }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1, border: `1px solid ${C.red}`, borderRadius: 8, padding: "16px 22px", background: "rgba(224,36,46,0.07)" }}>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.red, letterSpacing: 2 }}>NORTHERN LANE — IRAN RUNS PERMISSION</div>
              </div>
              <div style={{ flex: 1, border: `1px solid ${C.blue}`, borderRadius: 8, padding: "16px 22px", background: "rgba(77,163,255,0.07)" }}>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.blue, letterSpacing: 2 }}>SOUTHERN LANE — US RUNS GUIDANCE + BLOCKADE</div>
              </div>
            </div>
            <Fade at={f(412.04)}>
              <div style={{ fontFamily: MONO, fontSize: 21, color: C.dim, marginTop: 14 }}>
                UKMTO: MOST AIS-BROADCASTING SHIPS STILL USE IRAN’S ROUTE — A “FIVE TO ONE” RATIO THE REPORT DOESN’T FULLY EXPLAIN.
              </div>
            </Fade>
          </Fade>
          <Verdict at={f(422.84)} text="One strait. Two lanes. Two rulebooks." />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(11)} durationInFrames={f(416)}>
        <LeverStripLive />
      </Sequence>

      <ChapterCard kicker="PART FOUR" title="SEVEN LEVERS" at={0} hold={46} />
    </AbsoluteFill>
  );
};
