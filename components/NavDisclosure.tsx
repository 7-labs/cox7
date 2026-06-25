"use client";

import { type MouseEvent, type ReactNode, useRef } from "react";

export default function NavDisclosure({
  summary,
  children
}: {
  summary: ReactNode;
  children: ReactNode;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("a")) {
      return;
    }

    detailsRef.current?.removeAttribute("open");
  }

  return (
    <details className="nav-disclosure" ref={detailsRef}>
      <summary>{summary}</summary>
      <div className="nav-links" onClickCapture={handleClickCapture}>
        {children}
      </div>
    </details>
  );
}
