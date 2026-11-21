import { asc, desc, eq } from "drizzle-orm";
import { artworks, db, exhibitions, placements } from "@/lib/db";
import type { RoomConfig } from "@/lib/types";

export function roomOf(e: typeof exhibitions.$inferSelect): RoomConfig {
  return {
    roomWidth: e.roomWidth,
    roomLength: e.roomLength,
    roomHeight: e.roomHeight,
    wallColor: e.wallColor,
    floorColor: e.floorColor,
    ceilingColor: e.ceilingColor,
    lightColor: e.lightColor,
    lightIntensity: e.lightIntensity,
    spawnX: e.spawnX,
    spawnZ: e.spawnZ,
  };
}

export const listPublishedExhibitions = () =>
  db.select().from(exhibitions).where(eq(exhibitions.status, "published")).orderBy(desc(exhibitions.createdAt));

export const listExhibitions = () => db.select().from(exhibitions).orderBy(desc(exhibitions.createdAt));

export const listArtworks = () => db.select().from(artworks).orderBy(desc(artworks.createdAt));

export async function getArtwork(id: number) {
  const [row] = await db.select().from(artworks).where(eq(artworks.id, id));
  return row ?? null;
}

async function withPlacements(exhibition: typeof exhibitions.$inferSelect) {
  const rows = await db
    .select()
    .from(placements)
    .where(eq(placements.exhibitionId, exhibition.id))
    .orderBy(asc(placements.id));
  return { exhibition, placements: rows };
}

export async function getExhibitionBySlug(slug: string) {
  const [row] = await db.select().from(exhibitions).where(eq(exhibitions.slug, slug));
  return row ? withPlacements(row) : null;
}

export async function getExhibitionById(id: number) {
  const [row] = await db.select().from(exhibitions).where(eq(exhibitions.id, id));
  return row ? withPlacements(row) : null;
}
