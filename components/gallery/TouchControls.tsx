"use client";

import { useRef, useState, type PointerEvent, type RefObject } from "react";
import type { TouchInput } from "@/lib/gallery/input";

const MAX = 44;

export function TouchControls({ input }: { input: RefObject<TouchInput> }) {
  const stickId = useRef<number | null>(null);
  const lookPointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const updateStick = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    const k = dist > MAX ? MAX / dist : 1;
    const x = dx * k;
    const y = dy * k;
    setKnob({ x, y });
    input.current.moveX = x / MAX;
    input.current.moveY = -y / MAX;
  };

  const releaseStick = () => {
    stickId.current = null;
    setKnob({ x: 0, y: 0 });
    input.current.moveX = 0;
    input.current.moveY = 0;
  };

  return (
    <>
      <div
        className="absolute inset-0 z-10 touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          lookPointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          const p = lookPointer.current;
          if (!p || p.id !== e.pointerId) return;
          input.current.lookX += e.clientX - p.x;
          input.current.lookY += e.clientY - p.y;
          p.x = e.clientX;
          p.y = e.clientY;
        }}
        onPointerUp={() => (lookPointer.current = null)}
        onPointerCancel={() => (lookPointer.current = null)}
      />

      <div
        aria-label="Move"
        className="absolute bottom-8 left-6 z-20 h-32 w-32 touch-none rounded-full border-2 border-gold-500/70 bg-royal-950/50 backdrop-blur"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          stickId.current = e.pointerId;
          updateStick(e);
        }}
        onPointerMove={(e) => {
          if (stickId.current === e.pointerId) updateStick(e);
        }}
        onPointerUp={releaseStick}
        onPointerCancel={releaseStick}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-gold-600 bg-gradient-to-b from-gold-300 to-gold-500 shadow-lg"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
    </>
  );
}
