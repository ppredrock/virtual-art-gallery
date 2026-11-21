import type { RoomConfig, ScenePlacement, Wall } from "@/lib/types";

const INSET = 0.035;

export function placementTransform(
  p: Pick<ScenePlacement, "wall" | "offset" | "elevation">,
  room: Pick<RoomConfig, "roomWidth" | "roomLength">,
) {
  const hw = room.roomWidth / 2;
  const hl = room.roomLength / 2;
  switch (p.wall) {
    case "north":
      return { position: [p.offset, p.elevation, -hl + INSET] as const, rotationY: 0, normal: [0, 0, 1] as const };
    case "south":
      return { position: [p.offset, p.elevation, hl - INSET] as const, rotationY: Math.PI, normal: [0, 0, -1] as const };
    case "east":
      return { position: [hw - INSET, p.elevation, p.offset] as const, rotationY: -Math.PI / 2, normal: [-1, 0, 0] as const };
    case "west":
      return { position: [-hw + INSET, p.elevation, p.offset] as const, rotationY: Math.PI / 2, normal: [1, 0, 0] as const };
  }
}

export function wallSpan(wall: Wall, room: Pick<RoomConfig, "roomWidth" | "roomLength">) {
  return wall === "north" || wall === "south" ? room.roomWidth : room.roomLength;
}

export const FRAME_STYLES = {
  none: { thickness: 0, color: "#000000" },
  thin: { thickness: 0.04, color: "#f5f5f5" },
  gold: { thickness: 0.09, color: "#b8903a" },
  black: { thickness: 0.07, color: "#141414" },
} as const;
