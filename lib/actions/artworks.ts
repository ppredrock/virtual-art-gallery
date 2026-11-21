"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { cloudinaryEnabled, uploadImage } from "@/lib/cloudinary";
import { artworks, db } from "@/lib/db";

const fieldsSchema = z.object({
  title: z.string().trim().min(1).max(160),
  artist: z.string().trim().max(160),
  year: z.string().trim().max(20),
  medium: z.string().trim().max(160),
  description: z.string().trim().max(2000),
});

async function resolveImage(formData: FormData): Promise<string | null> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!cloudinaryEnabled()) return null;
    return uploadImage(file);
  }
  const url = z.string().url().safeParse(formData.get("imageUrl"));
  return url.success ? url.data : null;
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createArtwork(formData: FormData) {
  await requireAdmin();
  const fields = fieldsSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) fail("/admin/artworks", "Title is required.");
  const imageUrl = await resolveImage(formData);
  if (!imageUrl) fail("/admin/artworks", "Provide an image URL, or configure Cloudinary to upload a file.");

  await db.insert(artworks).values({ ...fields.data, imageUrl });
  revalidatePath("/admin/artworks");
  redirect("/admin/artworks");
}

export async function updateArtwork(id: number, formData: FormData) {
  await requireAdmin();
  const path = `/admin/artworks/${id}`;
  const fields = fieldsSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) fail(path, "Title is required.");
  const imageUrl = await resolveImage(formData);

  await db
    .update(artworks)
    .set({ ...fields.data, ...(imageUrl ? { imageUrl } : {}) })
    .where(eq(artworks.id, id));
  revalidatePath("/admin/artworks");
  redirect("/admin/artworks");
}

export async function deleteArtwork(id: number) {
  await requireAdmin();
  await db.delete(artworks).where(eq(artworks.id, id));
  revalidatePath("/admin/artworks");
}
