"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";

const SIZES = [
  { id: "42", label: "42mm", note: "For wrists 130–190mm" },
  { id: "46", label: "46mm", note: "For wrists 140–220mm" },
];

const BANDS = [
  { id: "woven", label: "Woven loop", note: "Recycled yarn, no buckle" },
  { id: "ocean", label: "Ocean fluoroelastomer", note: "100m deep dive certified, dual titanium buckle" },
  { id: "link", label: "Titanium link", note: "Grade 5 aero titanium, tool-free micro-adjust" },
];

const PRICE: Record<string, number> = { "42": 64900, "46": 71900 };
const BAND_DELTA: Record<string, number> = { woven: 0, ocean: 0, link: 18000 };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Option({
  selected,
  onSelect,
  label,
  note,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-white/70 bg-white/[0.06]"
          : "border-white/12 hover:border-white/30"
      }`}
    >
      <span className="block text-sm font-medium text-white">{label}</span>
      <span className="mt-0.5 block text-xs text-white/45">{note}</span>
    </button>
  );
}

export default function Reserve() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  const [size, setSize] = useState("46");
  const [band, setBand] = useState("woven");
  const total = PRICE[size] + BAND_DELTA[band];

  return (
    <section
      ref={ref}
      id="reserve"
      className="scroll-mt-14 border-t border-white/8 bg-[#08080a] px-6 py-28 md:px-12 md:py-36"
    >
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:gap-20"
      >
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.32em] text-white/40">
            Reserve
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-tight text-white md:text-6xl">
            Configure your One.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
            Reservations open in Bengaluru, Mumbai and Delhi first. No payment is
            taken until your configuration ships.
          </p>

          <dl className="mt-10 space-y-3 border-t border-white/10 pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/45">Case</dt>
              <dd className="text-white/85">{size}mm titanium</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/45">Band</dt>
              <dd className="text-white/85">
                {BANDS.find((b) => b.id === band)?.label}
              </dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3">
              <dt className="text-white/45">Total</dt>
              <dd className="font-medium text-white">{inr(total)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-8">
          <fieldset>
            <legend className="text-xs uppercase tracking-wider text-white/40">
              Case size
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {SIZES.map((s) => (
                <Option
                  key={s.id}
                  label={s.label}
                  note={s.note}
                  selected={size === s.id}
                  onSelect={() => setSize(s.id)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs uppercase tracking-wider text-white/40">
              Band
            </legend>
            <div className="mt-3 space-y-3">
              {BANDS.map((b) => (
                <Option
                  key={b.id}
                  label={b.label}
                  note={
                    BAND_DELTA[b.id] > 0
                      ? `${b.note} · +${inr(BAND_DELTA[b.id])}`
                      : b.note
                  }
                  selected={band === b.id}
                  onSelect={() => setBand(b.id)}
                />
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            className="w-full rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition-colors hover:bg-white/85"
          >
            Reserve for {inr(total)}
          </button>
          <p className="text-center text-xs text-white/35">
            Ships from March. Free returns for 30 days.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
