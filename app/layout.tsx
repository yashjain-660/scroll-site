import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "thewebvale One — Flagship Watch by thewebvale studios",
  description:
    "A timepiece engineered by thewebvale studios. Grade 5 aerospace titanium, LTPO OLED display, 100M water resistance, 72-hour battery.",
  authors: [{ name: "thewebvale studios", url: "https://thewebvale.com" }],
  creator: "thewebvale studios",
  publisher: "thewebvale studios",
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
    title: "thewebvale One — by thewebvale studios",
    description: "Engineered by thewebvale studios. Grade 5 titanium, LTPO display, 100M ocean-proof.",
    url: "https://watch.thewebvale.com",
    siteName: "thewebvale studios",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-[#08080a] text-white">{children}</body>
    </html>
  );
}
