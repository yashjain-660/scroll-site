import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://watch.thewebvale.com"),
  title: "thewebvale One — Flagship Watch by thewebvale studios",
  description:
    "A timepiece engineered by thewebvale studios. Grade 5 aerospace titanium, LTPO OLED display, 100M water resistance, 72-hour battery.",
  authors: [{ name: "thewebvale studios", url: "https://thewebvale.com" }],
  creator: "thewebvale studios",
  publisher: "thewebvale studios",
  keywords: [
    "thewebvale One",
    "thewebvale studios",
    "luxury smartwatch",
    "titanium watch",
    "aerospace engineering",
    "spatial design",
    "smartwatch India",
  ],
  alternates: {
    canonical: "https://watch.thewebvale.com",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "thewebvale One — Flagship Watch by thewebvale studios",
    description:
      "Engineered by thewebvale studios. Grade 5 titanium, LTPO display, 100M ocean-proof.",
    url: "https://watch.thewebvale.com",
    siteName: "thewebvale studios",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://watch.thewebvale.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "thewebvale One — Grade 5 Aerospace Titanium Smartwatch",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "thewebvale One — Flagship Watch by thewebvale studios",
    description:
      "Grade 5 aerospace titanium, LTPO OLED display, 100M water resistance, 72-hour battery.",
    images: ["https://watch.thewebvale.com/og-image.png"],
    creator: "@thewebvale",
  },
  other: {
    "geo.region": "IN-DL",
    "geo.placename": "New Delhi",
    "geo.position": "28.6139;77.2090",
    "ICBM": "28.6139, 77.2090",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      "@id": "https://watch.thewebvale.com/#product",
      "name": "thewebvale One",
      "image": "https://watch.thewebvale.com/og-image.png",
      "description":
        "A luxury flagship timepiece engineered by thewebvale studios. Grade 5 aerospace titanium chassis, sapphire crystal, LTPO OLED display, 100M water resistance, and 72-hour battery life.",
      "brand": {
        "@type": "Brand",
        "name": "thewebvale studios",
        "url": "https://thewebvale.com",
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "thewebvale studios",
        "url": "https://thewebvale.com",
        "logo": "https://thewebvale.com/logo.png",
      },
      "category": "Electronics > Wearables > Smartwatches",
      "material": "Grade 5 Aerospace Titanium, Sapphire Crystal",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "INR",
        "lowPrice": "64900",
        "highPrice": "89900",
        "offerCount": "6",
        "price": "64900",
        "availability": "https://schema.org/InStock",
        "url": "https://watch.thewebvale.com",
        "seller": {
          "@type": "Organization",
          "name": "thewebvale studios",
          "url": "https://thewebvale.com",
        },
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Chassis Material",
          "value": "Grade 5 Aerospace Titanium",
        },
        {
          "@type": "PropertyValue",
          "name": "Display",
          "value": "1000-nit LTPO OLED with Sapphire Crystal",
        },
        {
          "@type": "PropertyValue",
          "name": "Water Resistance",
          "value": "100 Meters / 10 ATM Dive Certified",
        },
        {
          "@type": "PropertyValue",
          "name": "Battery Life",
          "value": "72 Hours Continuous Multi-Sensor Operation",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://watch.thewebvale.com/#website",
      "url": "https://watch.thewebvale.com",
      "name": "thewebvale One — Flagship Watch",
      "description":
        "Experience thewebvale One, an aerospace-grade titanium luxury smartwatch designed and engineered by thewebvale studios.",
      "publisher": {
        "@type": "Organization",
        "name": "thewebvale studios",
        "url": "https://thewebvale.com",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} dark h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full bg-[#08080a] text-white">{children}</body>
    </html>
  );
}
