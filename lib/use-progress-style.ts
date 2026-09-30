"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";

/**
 * Drive an element's style from scroll progress, imperatively.
 *
 * Why not just hand the motion value to a `motion.div`: motion v13 compiles
 * scroll-linked style values into native WAAPI scroll animations, and on this
 * page that path proved unreliable. The `useTransform` input range becomes
 * literal keyframe offsets, so anything outside [0, 1] throws at bind time, and
 * a throw leaves the element half-bound — in practice `opacity` froze at a
 * stale value while `transform` kept tracking, which is how HUD furniture ended
 * up painted over sections it had supposedly faded out of.
 *
 * Writing style directly from the same progress value the 3D layer reads keeps
 * both layers in lockstep, and still runs outside React's render path.
 *
 * `apply` must be stable — wrap it in `useCallback` at the call site.
 */
export function useProgressStyle<T extends Element & ElementCSSInlineStyle>(
  progress: MotionValue<number>,
  apply: (el: T, p: number) => void,
) {
  const ref = useRef<T>(null);

  const run = useCallback(
    (p: number) => {
      if (ref.current) apply(ref.current, p);
    },
    [apply],
  );

  useMotionValueEvent(progress, "change", run);
  useEffect(() => run(progress.get()), [run, progress]);

  return ref;
}
