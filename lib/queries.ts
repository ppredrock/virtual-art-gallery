import { asc, desc, eq } from "drizzle-orm";
import { artistProfile, artworks, db, exhibitions, placements } from "@/lib/db";
import type { RoomConfig } from "@/lib/types";

export const DEFAULT_ARTIST_PROFILE = {
  id: 1,
  name: "Mimi",
  roles: "Artist · Painter · Dreamer",
  bio: "Hand-painted creations inspired by art and divine divinity. DM for orders.",
  imageUrl: "/artist.jpg",
  instagram: "@mimisbrushstrokes",
  email: "hello@mimisbrushstrokes.com",
  phone: "+91 98XXX XXXXX",
  location: "India · Worldwide Shipping",
  orderNote: "DM on Instagram or reach out via email for custom commissions and available originals.",
};

export async function getArtistProfile() {
  try {
    const [row] = await db.select().from(artistProfile).where(eq(artistProfile.id, 1));
    return row ?? DEFAULT_ARTIST_PROFILE;
  } catch {
    return DEFAULT_ARTIST_PROFILE;
  }
}

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

export async function listPublishedExhibitionsWithPreviews() {
  const list = await listPublishedExhibitions();
  if (list.length === 0) return [];
  const allPlacements = await db
    .select({
      exhibitionId: placements.exhibitionId,
      artworkId: artworks.id,
      title: artworks.title,
      imageUrl: artworks.imageUrl,
    })
    .from(placements)
    .innerJoin(artworks, eq(placements.artworkId, artworks.id))
    .orderBy(asc(placements.id));

  const byEx = new Map<number, { artworkId: number; title: string; imageUrl: string }[]>();
  for (const row of allPlacements) {
    const arr = byEx.get(row.exhibitionId) ?? [];
    arr.push({ artworkId: row.artworkId, title: row.title, imageUrl: row.imageUrl });
    byEx.set(row.exhibitionId, arr);
  }
  return list.map((ex) => ({
    ...ex,
    artworks: byEx.get(ex.id) ?? [],
  }));
}

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
