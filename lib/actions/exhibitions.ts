"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db, exhibitions, placements } from "@/lib/db";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const saveSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and dashes").max(80),
  description: z.string().max(2000),
  status: z.enum(["draft", "published"]),
  room: z.object({
    roomWidth: z.number().min(4).max(60),
    roomLength: z.number().min(4).max(60),
    roomHeight: z.number().min(2.5).max(12),
    wallColor: hex,
    floorColor: hex,
    ceilingColor: hex,
    lightColor: hex,
    lightIntensity: z.number().min(0.2).max(3),
    spawnX: z.number().min(-60).max(60),
    spawnZ: z.number().min(-60).max(60),
  }),
  placements: z
    .array(
      z.object({
        artworkId: z.number().int(),
        wall: z.enum(["north", "south", "east", "west"]),
        offset: z.number().min(-60).max(60),
        elevation: z.number().min(0.3).max(12),
        width: z.number().min(0.2).max(10),
        frame: z.enum(["none", "thin", "gold", "black"]),
      }),
    )
    .max(200),
});

export type SavePayload = z.input<typeof saveSchema>;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "exhibition";

export async function createExhibition(formData: FormData) {
  await requireAdmin();
  const title = z.string().trim().min(1).max(120).parse(formData.get("title"));
  const slug = `${slugify(title)}-${randomBytes(2).toString("hex")}`;
  const [row] = await db.insert(exhibitions).values({ title, slug }).returning({ id: exhibitions.id });
  redirect(`/admin/exhibitions/${row.id}`);
}

export async function saveExhibition(id: number, payload: SavePayload): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const parsed = saveSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const { room, placements: items, ...details } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(exhibitions)
        .set({ ...details, ...room })
        .where(eq(exhibitions.id, id));
      await tx.delete(placements).where(eq(placements.exhibitionId, id));
      if (items.length) await tx.insert(placements).values(items.map((p) => ({ ...p, exhibitionId: id })));
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return { ok: false, error: msg.includes("UNIQUE") ? "That slug is already used." : "Could not save." };
  }

  revalidatePath("/");
  revalidatePath(`/gallery/${details.slug}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteExhibition(id: number) {
  await requireAdmin();
  await db.delete(exhibitions).where(eq(exhibitions.id, id));
  revalidatePath("/");
  revalidatePath("/admin");
}
