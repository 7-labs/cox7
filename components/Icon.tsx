import type { SVGProps } from "react";

// Lightweight inline SVG icon set (Lucide-style, currentColor stroke).
// Server-safe: pure markup, no client runtime. Keep paths minimal.
const paths: Record<string, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  play: <path d="M6 4.5v15l13-7.5z" fill="currentColor" stroke="none" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  sparkles: (
    <>
      <path d="M12 3l1.8 4.6L18.4 9 13.8 10.4 12 15l-1.8-4.6L5.6 9l4.6-1.4z" />
      <path d="M19 14l.9 2.3L22 17l-2.1.7L19 20l-.9-2.3L16 17l2.1-.7z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  embed: <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 6l-4 12" />,
  trending: <path d="M3 16l5-5 4 4 8-8M16 7h5v5" />,
  zap: <path d="M13 3 4 14h7l-1 7 9-11h-7z" />,
  check: <path d="m5 12 5 5L20 7" />,
  cross: <path d="M6 6l12 12M18 6 6 18" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
};

type IconProps = SVGProps<SVGSVGElement> & {
  name: keyof typeof paths;
  size?: number;
};

export default function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
