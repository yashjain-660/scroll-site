import Image from "next/image";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const COLUMNS: { title: string; items: FooterLink[] }[] = [
  {
    title: "One",
    items: [
      { label: "Overview", href: "#top" },
      { label: "Specification", href: "#stage" },
      { label: "Bands", href: "#reserve" },
      { label: "Configure", href: "#reserve" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Setup Guide", href: "#top" },
      { label: "Warranty", href: "https://thewebvale.com#contact", external: true },
      { label: "Service Care", href: "https://thewebvale.com#contact", external: true },
      { label: "Concierge", href: "https://thewebvale.com#contact", external: true },
    ],
  },
  {
    title: "thewebvale studios",
    items: [
      { label: "About Studio", href: "https://thewebvale.com", external: true },
      { label: "Portfolio & Work", href: "https://thewebvale.com#portfolio", external: true },
      { label: "Hardware & Design", href: "https://thewebvale.com#services", external: true },
      { label: "Contact Engineering", href: "https://thewebvale.com#contact", external: true },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#08080a] px-6 py-16 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <a
              href="https://thewebvale.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-opacity hover:opacity-80"
              title="thewebvale studios — Sovereign Engineering & Digital Craft"
            >
              <Image
                src="/logo-white.png"
                alt="thewebvale studios"
                width={130}
                height={28}
                className="h-6 w-auto object-contain"
              />
            </a>
            <p className="mt-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/40">
              thewebvale studios
            </p>
            <p className="mt-2 text-xs text-white/30 max-w-xs leading-relaxed">
              Precision digital design, spatial 3D web experiences, and sovereign software architecture.
            </p>
          </div>
          {COLUMNS.map(({ title, items }) => (
            <div key={title}>
              <p className="text-xs uppercase tracking-wider text-white/40">
                {title}
              </p>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {item.label}
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
            Engineered and crafted by{" "}
            <a
              href="https://thewebvale.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/60 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
            >
              thewebvale studios
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
