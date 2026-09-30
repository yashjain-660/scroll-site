"use client";

import { useCallback } from "react";
import type { MotionValue } from "motion/react";

import { CH, hold } from "@/lib/anim";
import { useProgressStyle } from "@/lib/use-progress-style";

/**
 * A technical overlay that sits between the canvas and the copy.
 *
 * It does no layout work — its whole job is to make the product read as an
 * object under inspection rather than a render floating in a void: corner
 * brackets, a reticle around the subject, a model tab, and a chapter counter
 * that tells you where you are in a page this long.
 *
 * It is `absolute`, not `fixed`. Fixed positioning escaped the stage and left
 * the furniture painted over the gallery and reserve sections below it.
 */

export const CHAPTERS = [
  ["01", "INTRO", CH.hero[0]],
  ["02", "FORM", CH.orbit[0]],
  ["03", "CONSTRUCTION", CH.explode[0]],
  ["04", "WATER & DIVE", CH.water[0]],
  ["05", "DISPLAY & SENSORS", CH.display[0]],
  ["06", "FINISH", CH.finishes[0]],
  ["07", "SPECIFICATION", CH.specs[0]],
  ["08", "ORDER", CH.outro[0]],
] as const;

function Bracket({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute h-5 w-5 border-white/20 ${className}`}
    />
  );
}

export default function Hud({
  progress,
  chapter,
}: {
  progress: MotionValue<number>;
  chapter: number;
}) {
  // The furniture clears out as the outro takes the screen.
  const rootRef = useProgressStyle<HTMLDivElement>(
    progress,
    useCallback((el, p) => {
      const o = hold(p, [CH.outro[0], CH.outro[0] + 0.03], [1, 0]);
      el.style.opacity = String(o);
      el.style.visibility = o < 0.004 ? "hidden" : "visible";
    }, []),
  );

  // The reticle opens up as the watch is taken apart, then closes again.
  const reticleRef = useProgressStyle<SVGSVGElement>(
    progress,
    useCallback((el, p) => {
      const s = hold(
        p,
        [CH.hero[1], CH.explode[0], CH.explode[1], CH.finishes[1]],
        [0.62, 1, 1, 0.68],
      );
      const o = hold(
        p,
        [0, 0.04, CH.display[0], CH.display[1], CH.specs[1]],
        [0, 0.9, 0.9, 0.35, 0],
      );
      el.style.opacity = String(o);
      el.style.transform = `translate(-50%, -50%) scale(${s.toFixed(3)})`;
    }, []),
  );

  const hintRef = useProgressStyle<HTMLDivElement>(
    progress,
    useCallback((el, p) => {
      const o = hold(p, [0, 0.015, 0.045, 0.075], [0, 1, 1, 0]);
      el.style.opacity = String(o);
      el.style.visibility = o < 0.004 ? "hidden" : "visible";
    }, []),
  );

  const [num, name] = CHAPTERS[chapter];

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 select-none"
    >
      {/* corner brackets */}
      <Bracket className="left-5 top-16 border-l border-t md:left-8" />
      <Bracket className="right-5 top-16 border-r border-t md:right-8" />
      <Bracket className="bottom-5 left-5 border-b border-l md:left-8" />
      <Bracket className="bottom-5 right-5 border-b border-r md:right-8" />

      {/* reticle around the subject */}
      <svg
        ref={reticleRef}
        viewBox="0 0 400 400"
        className="absolute left-1/2 top-[28vh] md:top-1/2 h-[50vh] w-[50vh] md:h-[68vh] md:w-[68vh]"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <circle
          cx="200"
          cy="200"
          r="186"
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="0.7"
          strokeDasharray="2 7"
        />
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.7"
        />
        {[0, 90, 180, 270].map((deg) => (
          <line
            key={deg}
            x1="200"
            y1="6"
            x2="200"
            y2="20"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            transform={`rotate(${deg} 200 200)`}
          />
        ))}
      </svg>

      {/* model tab, right edge */}
      <div className="absolute right-0 top-[22vh] hidden md:block">
        <div className="flex items-center gap-2 bg-[#ece7dd] px-3 py-4 [writing-mode:vertical-rl]">
          <span className="h-1.5 w-1.5 rounded-full bg-black/70" />
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-black/80">
            One-44 Model
          </span>
        </div>
      </div>

      {/* chapter counter, left edge */}
      <div className="absolute left-5 top-1/2 hidden -translate-y-1/2 md:block md:left-8">
        <div className="flex items-center gap-3 [writing-mode:vertical-rl]">
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/70">
            {num} — {name}
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-white/25">
            / {CHAPTERS.length.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* dashed rules flanking the subject */}
      <div className="absolute inset-x-0 top-[28vh] md:top-1/2 flex items-center justify-between px-5 md:px-8">
        <span className="h-px w-[8vw] bg-[linear-gradient(to_right,rgba(255,255,255,0.22)_50%,transparent_50%)] bg-[length:7px_1px]" />
        <span className="h-px w-[8vw] bg-[linear-gradient(to_right,rgba(255,255,255,0.22)_50%,transparent_50%)] bg-[length:7px_1px]" />
      </div>

      {/* persistent scroll indicator */}
      <div
        ref={hintRef}
        className="absolute inset-x-0 bottom-7 flex items-center justify-center gap-3"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-bounce text-white/70"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-white/45">
          Scroll to continue
        </span>
      </div>
    </div>
  );
}
