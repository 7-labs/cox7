import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { site } from "@/lib/c7-data";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "C7 Sports Previews — Official YouTube Sports Preview Finder",
    template: "%s | C7 Sports Previews"
  },
  description: site.description,
  applicationName: site.name,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: "C7 Sports Previews",
    description: site.description
  },
  twitter: {
    card: "summary_large_image",
    title: "C7 Sports Previews",
    description: site.description
  }
};

export const viewport: Viewport = {
  themeColor: "#06070a",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="header">
            <nav className="nav" aria-label="Primary navigation">
              <Link className="logo" href="/" aria-label="C7 Sports Previews home">
                <span className="logo-mark">C7</span>
                <span>Sports Previews</span>
              </Link>
              <div className="nav-links nav-links-desktop">
                <Link href="/sports-previews/">All previews</Link>
                <Link href="/search/">Search</Link>
                <Link href="/nfl-previews/">NFL</Link>
                <Link href="/nba-previews/">NBA</Link>
                <Link href="/mlb-previews/">MLB</Link>
                <Link href="/nhl-previews/">NHL</Link>
                <Link href="/channels/">Channels</Link>
              </div>
              <details className="nav-disclosure">
                <summary>Browse</summary>
                <div className="nav-links">
                  <Link href="/sports-previews/">All previews</Link>
                  <Link href="/search/">Search</Link>
                  <Link href="/nfl-previews/">NFL</Link>
                  <Link href="/nba-previews/">NBA</Link>
                  <Link href="/mlb-previews/">MLB</Link>
                  <Link href="/nhl-previews/">NHL</Link>
                  <Link href="/channels/">Channels</Link>
                </div>
              </details>
            </nav>
          </header>
          <main className="main">{children}</main>
          <footer className="footer">
            <div className="footer-inner">
              <div>
                <strong>{site.shortName}</strong>
                <div>Official and trusted sports preview discovery.</div>
              </div>
              <div className="nav-links" aria-label="Footer navigation">
                <Link href="/search/">Search</Link>
                <Link href="/archive/">Archive</Link>
                <Link href="/upcoming-live-sports/">Upcoming</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
