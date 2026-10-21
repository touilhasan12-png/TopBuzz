import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, ARCHIVO, MONO } from "../theme";
import { Radar } from "../components/Radar";
import { BRoll } from "../components/FilmGrade";
import { SourceChip } from "../components/SourceChip";
import { GlitchTitle, SlamLine, TypeLine, Fade } from "../components/Type";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ASSETS = require("../data/assets.gen.json");

const f = (s: number) => Math.round(s * 30);

const Flavor: React.FC<{ at: number; word: string; note: string; idx: number }> = ({
  at, word, note, idx,
}) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 14, stiffness: 170 } });
  if (fr < at) return null;
  const dim = fr > at + 42 ? 0.32 : 1;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 26,
        opacity: Math.min(1, s * 1.5) * dim,
        transform: `translateX(${(1 - s) * -60}px)`,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 26, color: C.red, width: 44 }}>0{idx}</span>
      <span style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 88, color: C.ink, letterSpacing: 2 }}>
        CLOSED BY {word}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 24, color: C.dim }}>{note}</span>
    </div>
  );
};

const StatementCard: React.FC<{
  at: number;
  side: "left" | "right";
  accent: string;
  kicker: string;
  headline: string;
  quote: string;
  chips: string[];
  wide: boolean;
}> = ({ at, side, accent, kicker, headline, quote, chips, wide }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 20 } });
  if (fr < at) return null;
  const w = wide ? 820 : 700;
  return (
    <div
      style={{
        position: "absolute",
        top: 180,
        [side]: 110,
        width: w,
        opacity: Math.min(1, s * 1.4),
        transform: `translateY(${(1 - s) * 40}px)`,
      }}
    >
      <div
        style={{
          border: `1px solid ${C.line}`,
          borderLeft: `6px solid ${accent}`,
          background: "rgba(7,12,22,0.86)",
          padding: "36px 44px",
          borderRadius: 6,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: accent, marginBottom: 18 }}>{kicker}</div>
        <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 66, color: C.ink, lineHeight: 1.04, textTransform: "uppercase" }}>
          {headline}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: C.dim, marginTop: 22, lineHeight: 1.5 }}>{quote}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
          {chips.map((c, i) => (
            <SourceChip key={c} label={c} delay={at + 10 + i * 8} color={accent} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const ColdOpen: React.FC = () => {
  const fr = useCurrentFrame();
  const hasAerial = !!ASSETS.photos?.hormuz_aerial;
  const hasTanker = !!ASSETS.photos?.tanker_night;

  const radarOp = interpolate(fr, [f(13.5), f(15.5), f(61), f(63)], [1, 0.15, 0.15, 0.9], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {hasAerial && fr > f(0.5) && fr < f(13.5) ? (
        <BRoll src="photos/hormuz_aerial.jpg" dark={0.68} zoom={1.16} />
      ) : null}
      {hasTanker && fr > f(13.5) && fr < f(61) ? (
        <BRoll src="photos/tanker_night.jpg" dark={0.72} zoom={1.1} />
      ) : null}
      <AbsoluteFill style={{ opacity: radarOp }}>
        <Radar />
      </AbsoluteFill>

      <Fade at={6} out={f(13)}>
        <div style={{ position: "absolute", top: 92, left: 110, display: "flex", gap: 22, alignItems: "center" }}>
          <TypeLine text="26°34′N — 56°15′E  ·  STRAIT OF HORMUZ  ·  PERSIAN GULF" at={6} size={24} />
        </div>
      </Fade>

      <Sequence from={f(0.76)} durationInFrames={f(13.1)}>
        <StatementCard
          at={f(0.76)}
          side="left"
          accent={C.red}
          kicker="SATURDAY, OCTOBER 17 — IRGC NAVY"
          headline="“The strait is closed.”"
          quote="“…and passage is prohibited.”"
          chips={["IRNA — STATE NEWS AGENCY", "OFFICIAL STATEMENT"]}
          wide
        />
      </Sequence>

      <Sequence from={f(13.9)} durationInFrames={f(5.6)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <Fade at={f(13.9)}>
            <SlamLine text="The day before — something quite different." at={f(13.9)} size={58} color={C.dim} weight={700} />
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(19.6)} durationInFrames={f(14.4)}>
        <StatementCard
          at={f(19.6)}
          side="right"
          accent={C.blue}
          kicker="OCTOBER 16 — US CENTRAL COMMAND"
          headline="“Controlled by the United States.”"
          quote="“…and our regional partners — not Iran.” — ADM. BRAD COOPER"
          chips={["CENTCOM", "VIDEO MESSAGE"]}
          wide
        />
      </Sequence>

      <Sequence from={f(34.2)} durationInFrames={f(3.2)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 10 }}>
          <GlitchTitle text="One narrow waterway." at={f(34.3)} size={120} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={f(35.7)} durationInFrames={f(1.7)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ marginTop: 170 }}>
            <SlamLine text="Two official statements." at={f(35.7)} size={58} color={C.amber} weight={700} />
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(37.4)} durationInFrames={f(18)}>
        <AbsoluteFill>
          <Fade at={f(37.4)}>
            <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: C.dim }}>
              INDEPENDENT TRACKERS COUNT SOMETHING ELSE AGAIN
            </div>
          </Fade>
          {[
            { at: f(40.5), label: "KPLER", val: "7", sub: "commodity vessels · Oct 6", color: C.teal },
            { at: f(43.9), label: "JMIC", val: "1–9", sub: "daily · Oct 8–14 (draft advisory)", color: C.amber },
            { at: f(47.35), label: "WINDWARD", val: "12", sub: "Oct 18 · four with signals off", color: C.red },
          ].map((t, i) => {
            const s0 = t.at;
            const sp = spring({ frame: fr - s0, fps: 30, config: { damping: 16, stiffness: 150 } });
            if (fr < s0) return null;
            return (
              <div
                key={t.label}
                style={{
                  position: "absolute",
                  top: 380,
                  left: 240 + i * 500,
                  width: 440,
                  border: `1px solid ${C.line}`,
                  borderTop: `4px solid ${t.color}`,
                  background: "rgba(7,12,22,0.86)",
                  borderRadius: 6,
                  padding: "30px 34px",
                  opacity: Math.min(1, sp * 1.5),
                  transform: `translateY(${(1 - sp) * 30}px)`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color: t.color }}>{t.label}</div>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 900, fontSize: 110, color: C.ink, lineHeight: 1.15 }}>{t.val}</div>
                <div style={{ fontFamily: MONO, fontSize: 19, color: C.dim }}>{t.sub}</div>
              </div>
            );
          })}
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(55.5)} durationInFrames={f(5.6)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <GlitchTitle text="Closed — and open?" at={f(55.6)} size={130} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(61.2)} durationInFrames={f(11)}>
        <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 220, gap: 14 }}>
          <Fade at={f(61.2)}>
            <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: C.dim, marginBottom: 26 }}>
              “CLOSED” ISN’T ONE THING.
            </div>
          </Fade>
          <Flavor at={f(63.0)} word="LAW" note="declaration" idx={1} />
          <Flavor at={f(64.58)} word="WEAPONS" note="force" idx={2} />
          <Flavor at={f(65.89)} word="INSURANCE" note="price of risk" idx={3} />
          <Flavor at={f(67.34)} word="PERMISSION" note="process" idx={4} />
          <Flavor at={f(68.86)} word="FEAR" note="behavior" idx={5} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(72.5)} durationInFrames={f(10)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 26 }}>
          <SlamLine text="Not about who is right." at={f(72.6)} size={84} weight={900} />
          <SlamLine text="About how it works." at={f(75.3)} size={84} color={C.red} weight={900} />
          <Fade at={f(77.5)}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: C.dim, textAlign: "center", lineHeight: 1.6, maxWidth: 1200 }}>
              THE MECHANISMS THAT DECIDE WHETHER A STRAIT IS OPEN, CLOSED — OR SOMEWHERE IN BETWEEN.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={f(84.6)} durationInFrames={f(10.4)}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <Fade at={f(84.6)}>
            <div
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                padding: "44px 70px",
                background: "rgba(7,12,22,0.9)",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 8, color: C.amber, marginBottom: 22 }}>ONE RULE BEFORE WE START</div>
              <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 52, color: C.ink, lineHeight: 1.3 }}>
                Every number is attributed to a named source.
              </div>
              <Fade at={f(91.9)}>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 52, color: C.dim, marginTop: 16 }}>
                  Where they disagree — you’ll hear both.
                </div>
              </Fade>
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
