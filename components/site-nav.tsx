"use client";

import Image from "next/image";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";

const LINKS = [
  ["Design", "stage"],
  ["Worn", "gallery"],
  ["Reserve", "reserve"],
] as const;

export default function SiteNav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [active, setActive] = useState<string>("stage");

  useMotionValueEvent(scrollY, "change", (v) => {
    setSolid((prev) => (prev ? v > 40 : v > 80));
  });

  // Which section owns the middle of the viewport. An observer is cheaper than
  // measuring offsets on every scroll frame, and the stage alone is 1000vh.
  useEffect(() => {
    const ids = LINKS.map(([, id]) => id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
      style={{
        backgroundColor: solid ? "rgba(8,8,9,0.6)" : "rgba(8,8,9,0)",
        backdropFilter: solid ? "blur(14px)" : "none",
        borderBottom: solid
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid rgba(255,255,255,0)",
      }}
    >
      <nav className="flex h-14 items-center justify-between px-5 md:px-14">
        <a
          href="#top"
          className="flex items-center gap-2 group transition-opacity hover:opacity-85"
        >
          <Image
            src="/logo-white.png"
            alt="thewebvale studios"
            width={112}
            height={24}
            priority
            className="h-[18px] w-auto object-contain"
          />
          <span className="hidden sm:inline-block text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/40 border-l border-white/20 pl-2 ml-0.5">
            One
          </span>
        </a>
        <ul className="flex items-center gap-7">
          {LINKS.map(([label, id]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? "true" : undefined}
                className={`text-[0.6rem] font-semibold uppercase tracking-[0.24em] transition-colors ${
                  active === id
                    ? "text-[#f0ece4] underline decoration-dotted underline-offset-[6px]"
                    : "text-white/40 hover:text-white/75"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </motion.header>
  );
}
