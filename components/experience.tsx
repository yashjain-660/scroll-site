"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import {
  useScroll,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";

import { CH, hold } from "@/lib/anim";
import { useProgressStyle } from "@/lib/use-progress-style";
import { FINISHES } from "@/components/watch/watch-model";
import Hud, { CHAPTERS } from "@/components/hud";

/**
 * The canvas is client-only: it touches WebGL on mount, and there is nothing
 * useful for it to render on the server.
 */
const WatchScene = dynamic(() => import("@/components/watch/watch-scene"), {
  ssr: false,
});

/**
 * The stage is 1000vh tall, which gives 900vh of actual scroll (progress hits 1
 * when its last viewport is on screen). Chapter proportions live in `CH`.
 */
const STAGE_VH = 1000;

/** Shared type ramp — tight, uppercase, set close. */
const DISPLAY = "font-semibold uppercase leading-[0.88] tracking-[-0.03em]";
const LABEL =
  "text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/40";

/**
 * A chapter is just a named group of absolutely-positioned copy inside the one
 * sticky viewport box. It deliberately owns no height.
 *
 * The earlier version gave each chapter its own tall <section> with a sticky
 * child, which looked right but was not: a sticky element only stays pinned for
 * (sectionHeight - 100vh), so every chapter's copy tore loose and scrolled away
 * well before its progress range ended. Scroll length now comes from the stage
 * alone, and what you see is driven purely by progress.
 */
function Chapter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`absolute inset-y-0 inset-x-5 md:inset-x-14 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Copy that fades in over `[a, b]` and back out over `[c, d]` of progress.
 *
 * It writes style imperatively rather than handing motion values to a
 * `motion.div`. Motion v13 compiles scroll-linked style values into native
 * WAAPI scroll animations, and on this page that path was unreliable: the
 * `useTransform` input range becomes literal keyframe offsets, so anything
 * outside [0, 1] throws at bind time, and a throw leaves the element
 * half-bound — in practice `opacity` froze at a stale value while `y` kept
 * tracking. Driving it from the same progress value the 3D layer reads gives
 * both layers identical, predictable behaviour, and still keeps the work off
 * React's render path.
 */
function Fade({
  progress,
  at,
  children,
  className = "",
  entryY = 26,
  exitY = -18,
}: {
  progress: MotionValue<number>;
  at: [number, number, number, number];
  children: React.ReactNode;
  className?: string;
  /** how far the block rises into place; the hero starts already settled */
  entryY?: number;
  /** how far the block lifts as it leaves */
  exitY?: number;
}) {
  const ref = useProgressStyle<HTMLDivElement>(
    progress,
    useCallback(
      (el: HTMLDivElement, p: number) => {
        const o = hold(p, at, [0, 1, 1, 0]);
        const y = hold(p, at, [entryY, 0, 0, exitY]);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        // keeps faded-out copy from eating clicks or reaching a screen reader
        el.style.visibility = o < 0.004 ? "hidden" : "visible";
      },
      [at, entryY, exitY],
    ),
  );

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

/** Two-tier headline: a dim setup line, then the line that lands. */
function Headline({
  dim,
  bright,
  className = "",
}: {
  dim: string;
  bright: string;
  className?: string;
}) {
  return (
    <h2 className={`${DISPLAY} text-[8vw] md:text-[4.2vw] ${className}`}>
      <span className="block text-white/35">{dim}</span>
      <span className="block text-white">{bright}</span>
    </h2>
  );
}

const ORBIT_NOTES = [
  {
    kicker: "01 — Case",
    dim: "So light,",
    bright: "you forget it",
    body: "Grade 5 aerospace titanium, cut and polished in a single fixture so the lug line never breaks. 34 grams.",
    side: "left" as const,
  },
  {
    kicker: "02 — Crown",
    dim: "So precise,",
    bright: "you can count it",
    body: "The digital crown steps through the interface with haptic detents you can feel without looking down.",
    side: "right" as const,
  },
  {
    kicker: "03 — Profile",
    dim: "So thin,",
    bright: "it disappears",
    body: "9.7mm edge to edge. Slides under a cuff, holds its own against a dive bezel.",
    side: "left" as const,
  },
];

const PARTS = [
  ["Sapphire crystal", "Grown, not coated. 9 on the Mohs scale."],
  ["Bezel ring", "PVD-black steel, 0.4mm proud of the glass."],
  ["LTPO display", "Drops to 1Hz when you are not looking."],
  ["Titanium case", "Grade 5. 34 grams without the band."],
  ["Caseback", "Sealed to 100m, tested to 150m."],
  ["Sensor array", "Four-channel optical, green and infrared."],
];

/**
 * The display chapter runs three watch-face states back to back. Each beat is
 * [fade-in start, fully in, fade-out start, fully out] and every array must be
 * ascending — motion throws "Offsets must be monotonically non-decreasing" on a
 * range that doubles back, which takes the whole page down with it.
 */
const DISPLAY_BEATS: [number, number, number, number][] = [
  [0.44, 0.458, 0.47, 0.484],
  [0.486, 0.5, 0.515, 0.528],
  [0.53, 0.544, 0.562, 0.578],
];

/**
 * The hero is already on screen at progress 0, so its entry window sits before
 * zero and only the exit does any work.
 */
const HERO_BEATS: Record<string, [number, number, number, number]> = {
  kicker: [0, 0, 0.018, 0.05],
  title: [0, 0, 0.03, 0.085],
  sub: [0, 0, 0.02, 0.055],
  card: [0, 0, 0.015, 0.048],
};

const DISPLAY_COPY = [
  {
    dim: "Always on.",
    bright: "Never loud.",
    body: "An LTPO panel that drops to a single frame a second when your wrist is down, and hits 3000 nits when the sun is out.",
  },
  {
    dim: "Three rings.",
    bright: "No lectures.",
    body: "Move, exercise, stand. The only three numbers the watch will ever interrupt you about.",
  },
  {
    dim: "Reads at a glance,",
    bright: "mid-stride.",
    body: "Heart rate, pace and distance in one frame — sized to be legible while your arm is still moving.",
  },
];

const SPECS: [string, string][] = [
  ["Case", "44mm · Grade 5 titanium · 34g"],
  ["Display", "LTPO OLED · 3000 nits · 1–120Hz"],
  ["Crystal", "Sapphire · anti-reflective, both faces"],
  ["Battery", "72 hours typical · 18 days low power"],
  ["Sensors", "Optical HR · SpO₂ · ECG · skin temp · depth"],
  ["Water", "100m · EN 13319 dive rated"],
  ["Connectivity", "UWB · Wi-Fi 6E · Bluetooth 5.4 · LTE"],
  ["Materials", "95% recycled titanium, 100% recycled cobalt"],
];

export default function Experience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });

  // The finish name is discrete, so it is React state driven by the same
  // progress value the material lerp reads — one source of truth.
  const [finish, setFinish] = useState(0);
  const [chapter, setChapter] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const t =
      (p - (CH.finishes[0] + 0.02)) /
      (CH.finishes[1] - 0.02 - (CH.finishes[0] + 0.02));
    const i = Math.round(Math.min(Math.max(t, 0), 1) * (FINISHES.length - 1));
    setFinish((prev) => (prev === i ? prev : i));

    let c = 0;
    for (let k = 0; k < CHAPTERS.length; k++) if (p >= CHAPTERS[k][2]) c = k;
    setChapter((prev) => (prev === c ? prev : c));
  });

  // The canvas fades out as the outro copy takes over the screen.
  const canvasRef = useProgressStyle<HTMLDivElement>(
    scrollYProgress,
    useCallback((el: HTMLDivElement, p: number) => {
      el.style.opacity = String(
        hold(p, [CH.outro[0], CH.outro[0] + 0.03], [1, 0]),
      );
    }, []),
  );

  // A soft wash behind the product, shifting hue per chapter. Without it the
  // watch floats in flat black and the page reads as a render, not a set.
  const washRef = useProgressStyle<HTMLDivElement>(
    scrollYProgress,
    useCallback((el: HTMLDivElement, p: number) => {
      const stops = [0, CH.explode[0], CH.display[0], CH.finishes[0], CH.specs[0], 1];
      const r = hold(p, stops, [27, 32, 20, 36, 21, 8]);
      const g = hold(p, stops, [29, 34, 26, 29, 22, 8]);
      const b = hold(p, stops, [39, 45, 34, 34, 29, 10]);
      el.style.background =
        `radial-gradient(62% 52% at 50% 44%, rgb(${r.toFixed(0)} ${g.toFixed(0)} ${b.toFixed(0)}) 0%, #08080a 72%)`;
    }, []),
  );


  return (
    <div ref={stageRef} className="relative" style={{ height: `${STAGE_VH}vh` }}>
      {/* ---------- WebGL layer ---------- */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div ref={washRef} className="absolute inset-0" />
        <div ref={canvasRef} className="h-full w-full">
          <WatchScene progress={scrollYProgress} />
        </div>
        <Hud progress={scrollYProgress} chapter={chapter} />

        {/* phones stack copy under the product; this keeps it readable */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[52vh] bg-gradient-to-t from-[#08080a] via-[#08080a]/88 to-transparent md:hidden" />

        {/* ---------- copy layer, pinned to the same viewport box ---------- */}
        <div className="pointer-events-none absolute inset-0 z-30">
        {/* ---- 01 Hero: wordmark in the corner, product in clear space ---- */}
        <Chapter>
          <Fade
            progress={scrollYProgress}
            at={HERO_BEATS.kicker}
            entryY={0}
            className={`${LABEL} absolute left-0 top-[15vh]`}
          >
            Made for wrists. Built for years.
          </Fade>

          <Fade
            progress={scrollYProgress}
            at={HERO_BEATS.title}
            entryY={0}
            exitY={-70}
            className="absolute left-0 top-[19vh]"
          >
            <h1 className={`${DISPLAY} text-[22vw] text-[#f0ece4] md:text-[13vw]`}>
              One
            </h1>
          </Fade>

          <Fade
            progress={scrollYProgress}
            at={HERO_BEATS.sub}
            entryY={0}
            className="absolute left-0 top-[33vh] max-w-[15rem] text-sm leading-relaxed text-white/60 md:left-auto md:right-0 md:top-[40vh] md:max-w-xs md:text-right md:text-base"
          >
            Titanium, sapphire, and a display that knows when to shut up.
          </Fade>

          <Fade
            progress={scrollYProgress}
            at={HERO_BEATS.card}
            entryY={0}
            className="absolute bottom-[16vh] left-0 max-w-[15rem] border border-white/10 bg-white/[0.03] p-4"
          >
            <p className={`${LABEL} text-white/50`}>
              Designed
              <br />
              by thewebvale
            </p>
            <div className="my-3 h-px w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.2)_50%,transparent_50%)] bg-[length:6px_1px]" />
            <p className="text-right text-xs leading-relaxed text-white/45">
              A watch that gets
              <br />
              out of the way.
            </p>
          </Fade>
        </Chapter>

        {/* ---- 02 Form: one full turn, three notes ---- */}
        <Chapter>
            {ORBIT_NOTES.map((note, i) => {
              const span = (CH.orbit[1] - CH.orbit[0]) / ORBIT_NOTES.length;
              const a = CH.orbit[0] + i * span;
              return (
                <Fade
                  key={note.kicker}
                  progress={scrollYProgress}
                  at={[a, a + span * 0.22, a + span * 0.72, a + span * 0.96]}
                  className={`absolute bottom-[9vh] w-full max-w-sm md:bottom-auto md:top-[28vh] ${
                    note.side === "right" ? "right-0 md:text-right" : "left-0"
                  }`}
                >
                  <p className={LABEL}>{note.kicker}</p>
                  <Headline dim={note.dim} bright={note.bright} className="mt-4" />
                  <p className="mt-5 text-sm leading-relaxed text-white/55">
                    {note.body}
                  </p>
                </Fade>
              );
            })}
        </Chapter>

        {/* ---- 03 Construction ---- */}
        <Chapter>
            <Fade
              progress={scrollYProgress}
              at={[
                CH.explode[0],
                CH.explode[0] + 0.03,
                CH.explode[1] - 0.05,
                CH.explode[1] - 0.01,
              ]}
              className="absolute inset-x-0 bottom-[6vh] w-full max-w-[17rem] md:inset-x-auto md:left-0 md:bottom-auto md:top-[15vh]"
            >
              <p className={LABEL}>Construction</p>
              <Headline dim="Six parts." bright="One seam." className="mt-4" />
              <ul className="mt-7 space-y-3 border-l border-white/10 pl-5">
                {PARTS.map(([name, note]) => (
                  <li key={name}>
                    <p className="text-sm font-medium text-white/90">{name}</p>
                    <p className="text-xs leading-relaxed text-white/45">{note}</p>
                  </li>
                ))}
              </ul>
            </Fade>
        </Chapter>

        {/* ---- 04 Display ---- */}
        <Chapter>
            {DISPLAY_COPY.map((beat, i) => (
              <Fade
                key={beat.bright}
                progress={scrollYProgress}
                at={DISPLAY_BEATS[i]}
                className="absolute inset-x-0 bottom-[11vh]"
              >
                <Headline dim={beat.dim} bright={beat.bright} />
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
                  {beat.body}
                </p>
              </Fade>
            ))}
        </Chapter>

        {/* ---- 05 Finishes ---- */}
        <Chapter>
            <Fade
              progress={scrollYProgress}
              at={[
                CH.finishes[0],
                CH.finishes[0] + 0.02,
                CH.finishes[1] - 0.025,
                CH.finishes[1] - 0.002,
              ]}
              className="absolute inset-x-0 bottom-[11vh]"
            >
              <p className={LABEL}>Finishes</p>
              <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <h2 className={`${DISPLAY} text-[9vw] text-white md:text-[4.6vw]`}>
                  {FINISHES[finish].name}
                </h2>
                <div className="flex items-center gap-3">
                  {FINISHES.map((f, i) => (
                    <span
                      key={f.name}
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-white/25 transition-transform duration-300"
                      style={{
                        backgroundColor: f.case,
                        transform: i === finish ? "scale(1.6)" : "scale(1)",
                        opacity: i === finish ? 1 : 0.45,
                      }}
                    />
                  ))}
                </div>
              </div>
            </Fade>
        </Chapter>

        {/* ---- 06 Specification ---- */}
        <Chapter>
            <Fade
              progress={scrollYProgress}
              at={[CH.specs[0], CH.specs[0] + 0.02, CH.specs[1] - 0.02, CH.specs[1]]}
              className="absolute inset-x-0 bottom-[5vh] w-full md:inset-x-auto md:bottom-auto md:right-12 md:top-[18vh] md:max-w-md"
            >
              <p className={LABEL}>Specification</p>
              <dl className="mt-5 divide-y divide-white/10 border-y border-white/10">
                {SPECS.map(([k, v]) => (
                  <div key={k} className="flex gap-6 py-3">
                    <dt className="w-28 shrink-0 text-[0.65rem] uppercase tracking-[0.18em] text-white/40">
                      {k}
                    </dt>
                    <dd className="text-sm leading-relaxed text-white/80">{v}</dd>
                  </div>
                ))}
              </dl>
            </Fade>
        </Chapter>

        {/* ---- 07 Order ---- */}
        <Chapter className="flex items-center justify-center">
          <Fade
            progress={scrollYProgress}
            at={[CH.outro[0] + 0.03, CH.outro[0] + 0.065, 1, 1]}
            className="pointer-events-auto w-full max-w-4xl text-center"
          >
            <h2 className={`${DISPLAY} text-[15vw] text-[#f0ece4] md:text-[9vw]`}>
              Wear it once.
            </h2>
            <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-white/55">
              thewebvale One. From ₹64,900, or ₹5,408/mo for twelve months.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#reserve"
                className="rounded-full bg-[#ece7dd] px-7 py-3 text-sm font-medium text-black transition-colors hover:bg-white"
              >
                Reserve yours
              </a>
              <a
                href="#gallery"
                className="rounded-full border border-white/20 px-7 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
              >
                See it worn
              </a>
            </div>
          </Fade>
        </Chapter>
        </div>
      </div>
    </div>
  );
}
