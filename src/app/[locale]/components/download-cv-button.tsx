"use client";

import { useRef, useState } from "react";
import {
  IconProgress,
  IconProgress2,
  IconProgress3,
  IconProgress4,
  IconProgress5,
} from "nucleo-arcade";

const PROGRESS_ICONS = [
  IconProgress,
  IconProgress2,
  IconProgress3,
  IconProgress4,
  IconProgress5,
];

const FRAME_MS = 200;

interface DownloadCvButtonProps {
  href: string;
  label: string;
}

export function DownloadCvButton({ href, label }: DownloadCvButtonProps) {
  const [loading, setLoading] = useState(false);
  const [frame, setFrame] = useState(0);
  const busyRef = useRef(false);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;

    setLoading(true);
    setFrame(0);

    const minDuration = PROGRESS_ICONS.length * FRAME_MS;

    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % PROGRESS_ICONS.length);
    }, FRAME_MS);

    setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
      busyRef.current = false;

      const a = document.createElement("a");
      a.href = href;
      a.download = "";
      a.click();
    }, minDuration);
  }

  const ProgressIcon = PROGRESS_ICONS[frame];

  return (
    <a
      href={href}
      download
      onClick={handleClick}
      className="mt-3 inline-flex h-5 items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="relative inline-flex size-3.5 shrink-0 items-center justify-center">
        <span className={loading ? "invisible" : ""} aria-hidden="true">↓</span>
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <ProgressIcon size={14} aria-hidden="true" />
          </span>
        )}
      </span>
      {label}
    </a>
  );
}
