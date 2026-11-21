"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Crest } from "@/components/Crest";
import { createTouchInput } from "@/lib/gallery/input";
import type { RoomConfig, SceneArtwork, ScenePlacement } from "@/lib/types";
import { TouchControls } from "./TouchControls";

const GalleryScene = dynamic(() => import("./GalleryScene").then((m) => m.GalleryScene), { ssr: false });

type Props = {
  title: string;
  room: RoomConfig;
  artworks: SceneArtwork[];
  placements: ScenePlacement[];
};

export function GalleryViewer({ title, room, artworks, placements }: Props) {
  const [isTouch, setIsTouch] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const [entered, setEntered] = useState(false);
  const [nearId, setNearId] = useState<number | null>(null);
  const touchInput = useRef(createTouchInput());
  const near = useMemo(() => artworks.find((a) => a.id === nearId) ?? null, [artworks, nearId]);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const active = isTouch ? entered : locked;

  return (
    <div className="relative h-dvh w-full touch-none select-none overflow-hidden bg-royal-950">
      {isTouch !== null && (
        <GalleryScene
          mode="walk"
          room={room}
          artworks={artworks}
          placements={placements}
          onNear={setNearId}
          controls={isTouch ? "touch" : "pointer-lock"}
          touchInput={touchInput}
          onLockChange={setLocked}
          lockSelector="#enter-gallery"
        />
      )}

      {isTouch && entered && <TouchControls input={touchInput} />}

      <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-3">
        <Link
          href="/"
          className="pointer-events-auto rounded-full border border-gold-500/60 bg-royal-950/60 px-3 py-1 text-sm text-gold-200 backdrop-blur hover:bg-royal-900/80"
        >
          ← All exhibitions
        </Link>
        <span className="hidden text-lg font-semibold tracking-wide text-gold-200 font-[family-name:var(--font-display)] sm:inline">{title}</span>
      </div>

      {!active && isTouch !== null && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-royal-950/60 px-4 backdrop-blur-[2px]">
          <div className="max-w-sm rounded-2xl border-2 border-gold-500 bg-ivory p-7 text-center shadow-2xl">
            <Crest className="mx-auto h-12 w-12" />
            <h1 className="mt-2 text-3xl font-semibold text-royal-900">{title}</h1>
            <div className="gold-rule mt-3" />
            {isTouch ? (
              <p className="mt-4 text-sm text-royal-800/80">
                Drag the <strong>round pad</strong> to walk. Drag anywhere else on the screen to look around. Walk up to a painting to read about it.
              </p>
            ) : (
              <p className="mt-4 text-sm text-royal-800/80">
                Move with <kbd className="kbd">W</kbd> <kbd className="kbd">A</kbd> <kbd className="kbd">S</kbd> <kbd className="kbd">D</kbd>, look with
                the mouse (or the arrow keys), hold <kbd className="kbd">Shift</kbd> to hurry. Press <kbd className="kbd">Esc</kbd> to leave.
              </p>
            )}
            <button id="enter-gallery" className="btn-gold mt-5 w-full" onClick={isTouch ? () => setEntered(true) : undefined}>
              Enter gallery
            </button>
          </div>
        </div>
      )}

      {active && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-300/80" />
      )}

      {active && near && (
        <div
          className={`pointer-events-none absolute left-1/2 z-20 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-gold-500 bg-royal-950/85 p-4 text-ivory shadow-2xl backdrop-blur sm:p-5 ${
            isTouch ? "top-16" : "bottom-8"
          }`}
        >
          <div className="text-2xl font-semibold text-gold-200 font-[family-name:var(--font-display)]">{near.title}</div>
          <div className="text-sm text-royal-200">{[near.artist, near.year, near.medium].filter(Boolean).join(" · ")}</div>
          {near.description && <p className="mt-2 text-sm opacity-90">{near.description}</p>}
        </div>
      )}
    </div>
  );
}
