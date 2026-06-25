import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Icon from "@/components/Icon";
import { leagueIcons, site } from "@/lib/c7-data";

const navLinks: Array<{ href: string; label: string; icon?: React.ReactNode; emoji?: string }> = [
  { href: "/sports-previews/", label: "All previews", icon: <Icon name="grid" size={15} /> },
  { href: "/search/", label: "Search", icon: <Icon name="search" size={15} /> },
  { href: "/nfl-previews/", label: "NFL", emoji: leagueIcons.nfl },
  { href: "/nba-previews/", label: "NBA", emoji: leagueIcons.nba },
  { href: "/mlb-previews/", label: "MLB", emoji: leagueIcons.mlb },
  { href: "/nhl-previews/", label: "NHL", emoji: leagueIcons.nhl },
  { href: "/soccer-previews/", label: "Soccer", emoji: leagueIcons.soccer },
  { href: "/channels/", label: "Channels", icon: <Icon name="youtube" size={15} /> }
];

function NavItems() {
  return (
    <>
      {navLinks.map((link) => (
        <Link className="nav-link" href={link.href} key={link.href}>
          {link.emoji ? <span className="nav-emoji" aria-hidden="true">{link.emoji}</span> : link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
    </>
  );
}

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
                <NavItems />
              </div>
              <details className="nav-disclosure">
                <summary>
                  <Icon name="grid" size={16} />
                  Browse
                </summary>
                <div className="nav-links">
                  <NavItems />
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
                <Link href="/sports-previews/">All previews</Link>
                <Link href="/search/">Search</Link>
                <Link href="/channels/">Channels</Link>
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
