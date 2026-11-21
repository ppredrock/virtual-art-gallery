"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Crest } from "@/components/Crest";
import { placementTransform } from "@/lib/gallery/geometry";
import { createTouchInput } from "@/lib/gallery/input";
import type { RoomConfig, SceneArtwork, ScenePlacement } from "@/lib/types";
import type { Pose } from "./GalleryScene";
import { TouchControls } from "./TouchControls";

const GalleryScene = dynamic(() => import("./GalleryScene").then((m) => m.GalleryScene), { ssr: false });

type Props = {
  title: string;
  room: RoomConfig;
  artworks: SceneArtwork[];
  placements: ScenePlacement[];
};

function Minimap({
  room,
  placements,
  nearId,
  poseRef,
  className,
}: {
  room: RoomConfig;
  placements: ScenePlacement[];
  nearId: number | null;
  poseRef: RefObject<Pose>;
  className?: string;
}) {
  const visitorRef = useRef<SVGGElement>(null);
  const pad = 1.2;
  const vbX = -room.roomWidth / 2 - pad;
  const vbY = -room.roomLength / 2 - pad;
  const vbW = room.roomWidth + pad * 2;
  const vbH = room.roomLength + pad * 2;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const g = visitorRef.current;
      const p = poseRef.current;
      if (g && p) {
        const deg = -(p.yaw * 180) / Math.PI;
        g.setAttribute("transform", `translate(${p.x.toFixed(2)}, ${p.z.toFixed(2)}) rotate(${deg.toFixed(1)})`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [poseRef]);

  const showBench = room.roomWidth >= 8 && room.roomLength >= 9;

  return (
    <div
      className={`pointer-events-none rounded-xl border border-gold-500/40 bg-royal-950/70 p-2 shadow-xl backdrop-blur-md ${className ?? ""}`}
      aria-hidden
    >
      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="h-28 w-24 sm:h-32 sm:w-28">
        {/* room outline */}
        <rect
          x={-room.roomWidth / 2}
          y={-room.roomLength / 2}
          width={room.roomWidth}
          height={room.roomLength}
          fill="rgba(36, 15, 82, 0.45)"
          stroke="rgba(233, 208, 112, 0.55)"
          strokeWidth={0.22}
          rx={0.25}
        />

        {/* bench */}
        {showBench && (
          <rect
            x={-1.2}
            y={-room.roomLength * 0.08 - 0.3}
            width={2.4}
            height={0.6}
            rx={0.12}
            fill="rgba(201, 162, 39, 0.35)"
            stroke="rgba(233, 208, 112, 0.5)"
            strokeWidth={0.1}
          />
        )}

        {/* artworks */}
        {placements.map((p) => {
          const t = placementTransform(p, room);
          const isHoriz = p.wall === "north" || p.wall === "south";
          const w = isHoriz ? p.width : 0.28;
          const h = isHoriz ? 0.28 : p.width;
          const isNear = nearId === p.artworkId;
          return (
            <rect
              key={p.id}
              x={t.position[0] - w / 2}
              y={t.position[2] - h / 2}
              width={w}
              height={h}
              rx={0.08}
              fill={isNear ? "#f4e3a0" : "#c9a227"}
              opacity={isNear ? 1 : 0.7}
            />
          );
        })}

        {/* visitor */}
        <g ref={visitorRef} transform={`translate(${room.spawnX}, ${room.spawnZ})`}>
          <path d="M 0 0 L -1.3 -2.6 A 2.9 2.9 0 0 1 1.3 -2.6 Z" fill="rgba(244, 227, 160, 0.28)" />
          <circle r={0.42} fill="#f4e3a0" stroke="#150a33" strokeWidth={0.16} />
        </g>
      </svg>
    </div>
  );
}

export function GalleryViewer({ title, room, artworks, placements }: Props) {
  const [isTouch, setIsTouch] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const [entered, setEntered] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [nearId, setNearId] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number }>({
    loaded: 0,
    total: placements.length,
  });
  const touchInput = useRef(createTouchInput());
  const poseRef = useRef<Pose>({ x: room.spawnX, z: room.spawnZ, yaw: 0 });
  const near = useMemo(() => artworks.find((a) => a.id === nearId) ?? null, [artworks, nearId]);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const active = isTouch ? entered : locked;

  useEffect(() => {
    if (active) setHasEntered(true);
  }, [active]);

  const onProgress = useCallback((loaded: number, total: number) => {
    setProgress({ loaded, total });
  }, []);

  const ready = progress.total === 0 || progress.loaded >= progress.total;
  const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 100;

  return (
    <div className="relative h-dvh w-full touch-none select-none overflow-hidden bg-royal-950">
      {isTouch !== null && (
        <GalleryScene
          mode="walk"
          room={room}
          artworks={artworks}
          placements={placements}
          active={active}
          poseRef={poseRef}
          onNear={setNearId}
          onProgress={onProgress}
          controls={isTouch ? "touch" : "pointer-lock"}
          touchInput={touchInput}
          onLockChange={setLocked}
          lockSelector="#enter-gallery"
        />
      )}

      {/* Subtle museum vignette during the walk */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(13,8,22,0.55)_100%)] transition-opacity duration-700 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />

      {isTouch && entered && <TouchControls input={touchInput} />}

      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="pointer-events-auto rounded-full border border-gold-500/50 bg-royal-950/65 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-gold-200 backdrop-blur-md transition hover:border-gold-400 hover:bg-royal-900/85"
          >
            ← All exhibitions
          </Link>
          <span className="font-display hidden text-xl font-semibold tracking-wide text-gold-200 drop-shadow sm:inline">{title}</span>
        </div>

        <div
          className={`flex items-center gap-2 transition-opacity duration-500 ${
            active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {isTouch ? (
            <button
              type="button"
              onClick={() => setEntered(false)}
              className="pointer-events-auto rounded-full border border-gold-500/50 bg-royal-950/65 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-gold-200 backdrop-blur-md transition hover:bg-royal-900/85"
            >
              Pause
            </button>
          ) : (
            <span className="rounded-full border border-gold-500/30 bg-royal-950/55 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-gold-200/80 backdrop-blur-md">
              Esc · Pause
            </span>
          )}
        </div>
      </div>

      {/* Smoothly animated Entry / Pause curtain */}
      {isTouch !== null && (
        <div
          className={`absolute inset-0 z-30 grid place-items-center bg-royal-950/55 px-4 backdrop-blur-[3px] transition-all duration-700 ease-out ${
            active ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-2xl border border-gold-500/70 bg-ivory/95 p-7 text-center shadow-[0_24px_64px_-16px_rgba(13,8,22,0.75)] backdrop-blur-md transition-all duration-700 ease-out sm:p-8 ${
              active ? "translate-y-4 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"
            }`}
          >
            <Crest className="mx-auto h-12 w-12" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-700">
              {hasEntered ? "Tour Paused" : "Private Viewing"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-royal-900 sm:text-4xl">{title}</h1>
            <div className="gold-rule mt-3" />

            {isTouch ? (
              <p className="mt-4 text-sm leading-relaxed text-royal-800/80">
                Drag the <strong>round pad</strong> to walk. Drag anywhere else to look around. Step close to any painting to read its story.
              </p>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-royal-800/80">
                Walk with <kbd className="kbd">W</kbd> <kbd className="kbd">A</kbd> <kbd className="kbd">S</kbd> <kbd className="kbd">D</kbd>, look
                with the mouse, hold <kbd className="kbd">Shift</kbd> to hurry. Press <kbd className="kbd">Esc</kbd> anytime to pause.
              </p>
            )}

            {!ready && (
              <div className="mt-5">
                <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-royal-700">
                  <span>Curating room</span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-royal-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            <button
              id="enter-gallery"
              className="btn-gold mt-6 w-full py-2.5 text-sm uppercase tracking-[0.16em]"
              onClick={isTouch ? () => setEntered(true) : undefined}
            >
              {hasEntered ? "Resume tour" : "Enter gallery"}
            </button>
          </div>
        </div>
      )}

      {/* Center reticle */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-1/2 z-20 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-200/85 ring-4 ring-gold-400/20 transition-opacity duration-500 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Minimap */}
      {isTouch !== null && (
        <div
          className={`pointer-events-none absolute z-20 transition-all duration-500 ${
            isTouch ? "right-4 top-16" : "bottom-6 right-6"
          } ${active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
        >
          <Minimap room={room} placements={placements} nearId={nearId} poseRef={poseRef} />
        </div>
      )}

      {/* Artwork plaque */}
      <div
        className={`pointer-events-none absolute left-1/2 z-20 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 transition-all duration-300 ease-out ${
          isTouch ? "top-16" : "bottom-8"
        } ${active && near ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
      >
        {near && (
          <div className="rounded-xl border border-gold-500/70 bg-royal-950/85 p-4 text-ivory shadow-[0_16px_40px_-10px_rgba(13,8,22,0.8)] backdrop-blur-md sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-2xl font-semibold text-gold-200 sm:text-3xl">{near.title}</div>
                <div className="mt-0.5 text-xs uppercase tracking-[0.16em] text-gold-300/80">
                  {[near.artist, near.year, near.medium].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
            {near.description && <p className="mt-2.5 border-t border-gold-500/25 pt-2.5 text-sm leading-relaxed text-ivory/90">{near.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
