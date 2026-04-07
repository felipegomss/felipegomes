"use client";

import { useRef, useState } from "react";
import { Pause, Play, Loader, ExternalLink, Volume1, Volume2, VolumeOff } from "lucide-react";
import { PLAYLIST_URL } from "@/lib/constants";

const SOUNDCLOUD_TRACK = "https://soundcloud.com/sonotws/04-o-que-e-meu-ningue-m-me";
const TRACK_TITLE = "Slow Flow";
const TRACK_ARTIST = "Apple Music";
const VOLUME_LEVELS = [0, 25, 50] as const;

export function MusicWidget() {
  const [playing, setPlaying] = useState(false);
  const [volumeIndex, setVolumeIndex] = useState(2);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const pendingPlayRef = useRef(false);

  function loadWidget() {
    if (loaded) return;
    setLoaded(true);

    const timeout = setTimeout(() => setFailed(true), 5000);

    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.onerror = () => {
      clearTimeout(timeout);
      setFailed(true);
    };
    script.onload = () => {
      if (!iframeRef.current || !window.SC) {
        clearTimeout(timeout);
        setFailed(true);
        return;
      }
      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;
      widget.bind(window.SC.Widget.Events.READY, () => {
        clearTimeout(timeout);
        setReady(true);
        if (pendingPlayRef.current) {
          pendingPlayRef.current = false;
          widget.play();
          setPlaying(true);
        }
      });
      widget.bind(window.SC.Widget.Events.FINISH, () => setPlaying(false));
    };
    document.head.appendChild(script);
  }

  function toggle() {
    if (failed) {
      window.open(PLAYLIST_URL, "_blank");
      return;
    }
    if (!loaded) {
      pendingPlayRef.current = true;
      loadWidget();
      return;
    }
    if (!ready || !widgetRef.current) return;
    if (playing) {
      widgetRef.current.pause();
    } else {
      widgetRef.current.play();
    }
    setPlaying((p) => !p);
  }

  function cycleVolume() {
    if (!widgetRef.current) return;
    const next = (volumeIndex + 1) % VOLUME_LEVELS.length;
    widgetRef.current.setVolume(VOLUME_LEVELS[next]);
    setVolumeIndex(next);
  }

  const volume = VOLUME_LEVELS[volumeIndex];
  const VolumeIcon = volume === 0 ? VolumeOff : volume === 25 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-3 border-t border-border p-4">
      {loaded && (
        <iframe
          ref={iframeRef}
          className="hidden"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(SOUNDCLOUD_TRACK)}&auto_play=false&show_artwork=false`}
        />
      )}

      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={toggle}
        className="group/play relative size-10 shrink-0 cursor-pointer overflow-hidden rounded"
      >
        <img
          src="/slow-flow-cover.webp"
          alt="Slow Flow playlist cover"
          className="size-full object-cover"
        />
        <span
          className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
            loaded && !ready && !failed ? "opacity-100" : "opacity-0 group-hover/play:opacity-100"
          }`}
        >
          {loaded && !ready && !failed ? (
            <Loader size={14} className="animate-spin text-white" aria-hidden="true" />
          ) : playing ? (
            <Pause size={14} fill="white" className="text-white" aria-hidden="true" />
          ) : (
            <Play size={14} fill="white" className="ml-0.5 text-white" aria-hidden="true" />
          )}
        </span>
      </button>

      <a
        href={PLAYLIST_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-umami-event="music-playlist"
        className="group flex-1 overflow-hidden"
      >
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-bold text-foreground">
            {"\u266B"} {TRACK_TITLE}
          </p>
          <ExternalLink
            size={10}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-50"
            aria-hidden="true"
          />
        </div>
        <p className="text-2xs text-muted-foreground-subtle">{TRACK_ARTIST}</p>
      </a>

      <div className="flex items-center gap-2">
        {playing && (
          <div className="flex h-3 items-end gap-px">
            {[0.6, 1, 0.4, 0.8, 0.5].map((h, i) => (
              <span
                key={i}
                className="w-0.5 animate-pulse rounded-full bg-foreground"
                style={{
                  height: `${h * 100}%`,
                  animationDelay: `${i * 150}ms`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
          </div>
        )}

        {playing && (
          <button
            type="button"
            aria-label={`Volume: ${volume}%`}
            onClick={cycleVolume}
            className="cursor-pointer text-muted-foreground-subtle transition-colors hover:text-foreground"
          >
            <VolumeIcon size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

type SoundCloudWidget = {
  play: () => void;
  pause: () => void;
  setVolume: (v: number) => void;
  bind: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    SC?: {
      Widget: ((iframe: HTMLIFrameElement) => SoundCloudWidget) & {
        Events: { READY: string; FINISH: string };
      };
    };
  }
}
