"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveExhibition } from "@/lib/actions/exhibitions";
import { wallSpan } from "@/lib/gallery/geometry";
import type { Frame, RoomConfig, SceneArtwork, ScenePlacement, Wall } from "@/lib/types";

const GalleryScene = dynamic(() => import("@/components/gallery/GalleryScene").then((m) => m.GalleryScene), {
  ssr: false,
});

type State = {
  title: string;
  slug: string;
  description: string;
  status: "draft" | "published";
  room: RoomConfig;
  placements: ScenePlacement[];
};

const WALLS: Wall[] = ["north", "south", "east", "west"];
const FRAMES: Frame[] = ["none", "thin", "gold", "black"];

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="label flex justify-between">
        {label}
        <span className="font-mono normal-case text-neutral-800">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full cursor-pointer rounded border border-neutral-300"
      />
    </label>
  );
}

export function ExhibitionEditor({
  id,
  initial,
  artworks,
}: {
  id: number;
  initial: State;
  artworks: SceneArtwork[];
}) {
  const [state, setState] = useState<State>(initial);
  const [selected, setSelected] = useState<number | null>(initial.placements[0]?.id ?? null);
  const [tempId, setTempId] = useState(-1);
  const [pending, startTransition] = useTransition();

  const setRoom = (patch: Partial<RoomConfig>) => setState((s) => ({ ...s, room: { ...s.room, ...patch } }));
  const patchPlacement = (pid: number, patch: Partial<ScenePlacement>) =>
    setState((s) => ({ ...s, placements: s.placements.map((p) => (p.id === pid ? { ...p, ...patch } : p)) }));

  const addPlacement = () => {
    if (artworks.length === 0) {
      toast.error("Add some artworks first.");
      return;
    }
    const p: ScenePlacement = {
      id: tempId,
      artworkId: artworks[0].id,
      wall: "north",
      offset: 0,
      elevation: 1.6,
      width: 1.6,
      frame: "thin",
    };
    setTempId(tempId - 1);
    setState((s) => ({ ...s, placements: [...s.placements, p] }));
    setSelected(p.id);
  };

  const removePlacement = (pid: number) => {
    setState((s) => ({ ...s, placements: s.placements.filter((p) => p.id !== pid) }));
    setSelected((cur) => (cur === pid ? null : cur));
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveExhibition(id, {
        title: state.title,
        slug: state.slug,
        description: state.description,
        status: state.status,
        room: state.room,
        placements: state.placements.map(({ id: _id, ...rest }) => rest),
      });
      if (result.ok) toast.success("Saved");
      else toast.error(result.error ?? "Could not save");
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="h-[70vh] min-h-[22rem] overflow-hidden rounded-xl border-2 border-gold-500 shadow-lg">
          <GalleryScene
            mode="orbit"
            room={state.room}
            artworks={artworks}
            placements={state.placements}
            selectedId={selected}
            onSelect={setSelected}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Drag to orbit, scroll to zoom. Click a frame to select it. Changes are live here and saved with “Save”.
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Link href="/admin" className="text-sm text-royal-600 hover:text-gold-700">
            ← Exhibitions
          </Link>
          <div className="flex gap-2">
            <Link href={`/gallery/${state.slug}`} className="btn-ghost" target="_blank">
              Open
            </Link>
            <button className="btn-gold" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <section className="card space-y-3">
          <h2 className="font-medium">Details</h2>
          <div>
            <label className="label">Title</label>
            <input className="input" value={state.title} onChange={(e) => setState({ ...state, title: e.target.value })} />
          </div>
          <div>
            <label className="label">URL slug</label>
            <input className="input" value={state.slug} onChange={(e) => setState({ ...state, slug: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              className="input"
              value={state.description}
              onChange={(e) => setState({ ...state, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={state.status}
              onChange={(e) => setState({ ...state, status: e.target.value as State["status"] })}
            >
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published</option>
            </select>
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-medium">Room</h2>
          <Slider label="Width (m)" value={state.room.roomWidth} min={6} max={40} step={0.5} onChange={(v) => setRoom({ roomWidth: v })} />
          <Slider label="Length (m)" value={state.room.roomLength} min={6} max={40} step={0.5} onChange={(v) => setRoom({ roomLength: v })} />
          <Slider label="Height (m)" value={state.room.roomHeight} min={3} max={10} step={0.1} onChange={(v) => setRoom({ roomHeight: v })} />
          <div className="grid grid-cols-4 gap-2">
            <ColorField label="Walls" value={state.room.wallColor} onChange={(v) => setRoom({ wallColor: v })} />
            <ColorField label="Floor" value={state.room.floorColor} onChange={(v) => setRoom({ floorColor: v })} />
            <ColorField label="Ceiling" value={state.room.ceilingColor} onChange={(v) => setRoom({ ceilingColor: v })} />
            <ColorField label="Light" value={state.room.lightColor} onChange={(v) => setRoom({ lightColor: v })} />
          </div>
          <Slider label="Light intensity" value={state.room.lightIntensity} min={0.2} max={3} step={0.05} onChange={(v) => setRoom({ lightIntensity: v })} />
          <Slider
            label="Start position X"
            value={state.room.spawnX}
            min={-state.room.roomWidth / 2 + 0.5}
            max={state.room.roomWidth / 2 - 0.5}
            step={0.1}
            onChange={(v) => setRoom({ spawnX: v })}
          />
          <Slider
            label="Start position Z"
            value={state.room.spawnZ}
            min={-state.room.roomLength / 2 + 0.5}
            max={state.room.roomLength / 2 - 0.5}
            step={0.1}
            onChange={(v) => setRoom({ spawnZ: v })}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Artworks on the walls</h2>
            <button className="btn-ghost" onClick={addPlacement}>
              + Add
            </button>
          </div>

          {state.placements.map((p) => {
            const span = wallSpan(p.wall, state.room);
            const limit = Math.max(0, span / 2 - p.width / 2);
            const isSel = selected === p.id;
            return (
              <div
                key={p.id}
                className={`card space-y-3 ${isSel ? "border-gold-500 ring-2 ring-gold-300" : ""}`}
                onClick={() => setSelected(p.id)}
              >
                <div className="flex items-center gap-2">
                  <select
                    className="input"
                    value={p.artworkId}
                    onChange={(e) => patchPlacement(p.id, { artworkId: Number(e.target.value) })}
                  >
                    {artworks.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                  <button className="btn-danger" onClick={() => removePlacement(p.id)}>
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Wall</label>
                    <select
                      className="input"
                      value={p.wall}
                      onChange={(e) => patchPlacement(p.id, { wall: e.target.value as Wall, offset: 0 })}
                    >
                      {WALLS.map((w) => (
                        <option key={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Frame</label>
                    <select className="input" value={p.frame} onChange={(e) => patchPlacement(p.id, { frame: e.target.value as Frame })}>
                      {FRAMES.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Slider
                  label="Position along wall"
                  value={Math.max(-limit, Math.min(limit, p.offset))}
                  min={-limit}
                  max={limit}
                  step={0.05}
                  onChange={(v) => patchPlacement(p.id, { offset: v })}
                />
                <Slider label="Height from floor" value={p.elevation} min={0.5} max={Math.max(1, state.room.roomHeight - 0.5)} step={0.05} onChange={(v) => patchPlacement(p.id, { elevation: v })} />
                <Slider label="Width (m)" value={p.width} min={0.4} max={5} step={0.05} onChange={(v) => patchPlacement(p.id, { width: v })} />
              </div>
            );
          })}
          {state.placements.length === 0 && <p className="text-sm text-neutral-500">No artworks placed yet.</p>}
        </section>
      </div>
    </div>
  );
}
