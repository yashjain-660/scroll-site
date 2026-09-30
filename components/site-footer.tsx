import Image from "next/image";

const COLUMNS: [string, string[]][] = [
  ["One", ["Overview", "Specification", "Bands", "Compare"]],
  ["Support", ["Setup", "Repair", "Warranty", "Contact"]],
  ["thewebvale studios", ["Studio", "Work", "Careers", "Press"]],
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#08080a] px-6 py-16 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Image
              src="/logo-white.png"
              alt="thewebvale studios"
              width={130}
              height={28}
              className="h-6 w-auto object-contain"
            />
            <p className="mt-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/40">
              thewebvale studios
            </p>
          </div>
          {COLUMNS.map(([title, items]) => (
            <div key={title}>
              <p className="text-xs uppercase tracking-wider text-white/40">
                {title}
              </p>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#top"
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/8 pt-6 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} thewebvale studios. All rights reserved.</p>
          <p>
            Engineered and crafted by thewebvale studios.
          </p>
        </div>
      </div>
    </footer>
  );
}
