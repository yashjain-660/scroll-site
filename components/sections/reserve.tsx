"use client";

import { motion, useInView, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";

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
  const bandLabel = BANDS.find((b) => b.id === band)?.label || "Band";

  // Reservation Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "New Delhi",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reservationCode, setReservationCode] = useState("");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = "WV-ONE-" + Math.floor(100000 + Math.random() * 900000);
    setReservationCode(code);
    setIsSubmitted(true);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello TheWebVale Concierge, I would like to confirm my reservation for thewebvale One.\n\n` +
      `• Reservation ID: ${reservationCode}\n` +
      `• Configuration: ${size}mm Grade 5 Titanium\n` +
      `• Band: ${bandLabel}\n` +
      `• Value: ${inr(total)}\n` +
      `• Name: ${formData.name}\n` +
      `• City: ${formData.city}`
  );

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
              <dd className="text-white/85">{bandLabel}</dd>
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
            onClick={() => {
              setIsSubmitted(false);
              setIsOpen(true);
            }}
            className="w-full cursor-pointer rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-[0.99] shadow-lg shadow-white/5"
          >
            Reserve for {inr(total)}
          </button>
          <p className="text-center text-xs text-white/35">
            Ships from March. Free returns for 30 days. Priority allocation.
          </p>
        </div>
      </motion.div>

      {/* Interactive Reservation Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#0f0f12] p-6 sm:p-8 shadow-2xl"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close dialog"
                className="absolute right-5 top-5 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>

              {!isSubmitted ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-white/45">
                      Bespoke Allocation
                    </p>
                  </div>
                  <h3
                    id="modal-title"
                    className="mt-2 text-2xl font-serif text-white tracking-tight"
                  >
                    Reserve Your thewebvale One
                  </h3>
                  <div className="mt-3 rounded-lg border border-white/8 bg-white/[0.03] p-3 text-xs text-white/70">
                    <p className="font-medium text-white">
                      {size}mm Aerospace Titanium • {bandLabel}
                    </p>
                    <p className="mt-1 text-white/45">
                      Estimated Delivery: March • Zero upfront charge today • Total:{" "}
                      <span className="font-medium text-white">{inr(total)}</span>
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label
                        htmlFor="res-name"
                        className="block text-xs uppercase tracking-wider text-white/50"
                      >
                        Full Name
                      </label>
                      <input
                        id="res-name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Yash Jain"
                        className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/50 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="res-email"
                          className="block text-xs uppercase tracking-wider text-white/50"
                        >
                          Email Address
                        </label>
                        <input
                          id="res-email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="client@domain.com"
                          className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="res-phone"
                          className="block text-xs uppercase tracking-wider text-white/50"
                        >
                          Phone / WhatsApp
                        </label>
                        <input
                          id="res-phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+91 98765 43210"
                          className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="res-city"
                        className="block text-xs uppercase tracking-wider text-white/50"
                      >
                        Delivery City / Region
                      </label>
                      <input
                        id="res-city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="New Delhi, Bengaluru, Mumbai"
                        className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/50 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="mt-6 w-full cursor-pointer rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-[0.99]"
                    >
                      Confirm Reservation ({inr(total)})
                    </button>
                    <p className="text-center text-[0.68rem] text-white/35">
                      Zero payment charged today. Encrypted and managed directly by thewebvale studios concierge.
                    </p>
                  </form>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-2xl">
                    ✓
                  </div>
                  <h3 className="mt-4 font-serif text-2xl text-white">
                    Reservation Confirmed
                  </h3>
                  <p className="mt-1 font-mono text-sm tracking-wider text-emerald-400">
                    {reservationCode}
                  </p>
                  <p className="mt-3 text-xs text-white/60 leading-relaxed max-w-sm mx-auto">
                    Thank you, {formData.name}. Your {size}mm titanium allocation has been logged. Our concierge will contact you via WhatsApp and email prior to March dispatch.
                  </p>

                  <div className="mt-6 space-y-3">
                    <a
                      href={`https://wa.me/918770183178?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-950/40"
                    >
                      <span>💬</span> Connect with Concierge on WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="w-full rounded-full border border-white/15 px-6 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
