const COLUMNS: [string, string[]][] = [
  ["One", ["Overview", "Specification", "Bands", "Compare"]],
  ["Support", ["Setup", "Repair", "Warranty", "Contact"]],
  ["thewebvale", ["Studio", "Work", "Careers", "Press"]],
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#08080a] px-6 py-16 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          <p className="text-xl font-semibold uppercase tracking-[-0.02em] text-[#f0ece4]">
            thewebvale
            <span className="text-white/35"> One</span>
          </p>
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
          <p>© {new Date().getFullYear()} thewebvale. A concept product.</p>
          <p>
            Watch modelled procedurally in three.js. Lifestyle photography is
            placeholder stock.
          </p>
        </div>
      </div>
    </footer>
  );
}
