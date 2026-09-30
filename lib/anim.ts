/**
 * Tiny keyframe helpers shared by the DOM layer and the WebGL layer.
 *
 * The whole site is driven by a single number: document scroll progress, 0 -> 1.
 * Everything else (camera dolly, watch rotation, explode amount, copy fades) is
 * a pure function of that number, so the DOM and the 3D scene can never drift
 * out of sync.
 */

export const clamp = (v: number, min = 0, max = 1) =>
  v < min ? min : v > max ? max : v;

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Frame-rate independent approach, the three.js `damp` formula.
 * `lambda` is roughly "how fast", higher is snappier.
 */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Remap `v` from [inMin, inMax] to [0, 1], clamped. */
export const range = (v: number, inMin: number, inMax: number) =>
  inMax === inMin ? 0 : clamp((v - inMin) / (inMax - inMin));

/**
 * Piecewise-linear track: `stops` are ascending progress values, `values` are
 * the value at each stop. Outside the range it holds the end values, which is
 * what keeps a chapter parked while other chapters animate.
 */
export function track(p: number, stops: number[], values: number[]): number {
  if (stops.length !== values.length) {
    throw new Error("track(): stops and values must be the same length");
  }
  if (p <= stops[0]) return values[0];
  const last = stops.length - 1;
  if (p >= stops[last]) return values[last];
  for (let i = 0; i < last; i++) {
    if (p <= stops[i + 1]) {
      const t = (p - stops[i]) / (stops[i + 1] - stops[i]);
      return lerp(values[i], values[i + 1], t);
    }
  }
  return values[last];
}

/** Smooth ease used for camera moves, so chapter joins don't read as corners. */
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** `track` with each segment eased. */
export function trackEased(p: number, stops: number[], values: number[]): number {
  if (p <= stops[0]) return values[0];
  const last = stops.length - 1;
  if (p >= stops[last]) return values[last];
  for (let i = 0; i < last; i++) {
    if (p <= stops[i + 1]) {
      const t = (p - stops[i]) / (stops[i + 1] - stops[i]);
      return lerp(values[i], values[i + 1], easeInOut(t));
    }
  }
  return values[last];
}

/**
 * Chapter boundaries in global scroll progress.
 *
 * Section heights in `app/page.tsx` are chosen to land on these numbers; if you
 * change one, change the other. Keeping them in one place is the only reason
 * the camera knows which chapter it is in.
 */
export const CH = {
  hero: [0.0, 0.08] as const,
  orbit: [0.08, 0.20] as const,
  explode: [0.20, 0.35] as const,
  water: [0.35, 0.49] as const,
  display: [0.49, 0.63] as const,
  finishes: [0.63, 0.76] as const,
  specs: [0.76, 0.88] as const,
  outro: [0.88, 1.0] as const,
};

/**
 * Like `track`, but duplicate leading stops mean "already arrived".
 *
 * The copy layer needs `[0, 0, a, b]` to read as *fully visible at progress 0,
 * then leave* — `track` would clamp that to the first value and start the hero
 * invisible.
 */
export function hold(p: number, stops: number[], values: number[]): number {
  if (p <= stops[0]) {
    let i = 0;
    while (i + 1 < stops.length && stops[i + 1] === stops[i]) i++;
    return values[i];
  }
  const last = stops.length - 1;
  if (p >= stops[last]) return values[last];
  for (let i = 0; i < last; i++) {
    if (p <= stops[i + 1]) {
      const w = stops[i + 1] - stops[i];
      if (w <= 0) continue;
      return lerp(values[i], values[i + 1], (p - stops[i]) / w);
    }
  }
  return values[last];
}
