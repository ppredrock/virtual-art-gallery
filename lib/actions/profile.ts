"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { cloudinaryEnabled, uploadImage } from "@/lib/cloudinary";
import { artistProfile, db } from "@/lib/db";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  roles: z.string().trim().max(160),
  bio: z.string().trim().max(2000),
  instagram: z.string().trim().max(160),
  email: z.string().trim().max(160),
  phone: z.string().trim().max(80),
  location: z.string().trim().max(160),
  orderNote: z.string().trim().max(500),
});

function fail(message: string): never {
  redirect(`/admin/profile?error=${encodeURIComponent(message)}`);
}

async function resolveArtistImage(formData: FormData): Promise<string> {
  if (formData.get("removeImage") === "on") return "";

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (cloudinaryEnabled()) return uploadImage(file);
    if (file.size > 900 * 1024) {
      fail("Image is over 900 KB. Use a smaller photo, paste an image URL, or configure Cloudinary.");
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }

  const rawUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!rawUrl) return "";
  if (rawUrl.startsWith("/") || rawUrl.startsWith("data:image/")) return rawUrl;
  const parsed = z.string().url().safeParse(rawUrl);
  if (!parsed.success) fail("Please enter a valid image URL.");
  return parsed.data;
}

export async function saveArtistProfile(formData: FormData) {
  await requireAdmin();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) fail("Name is required.");

  const imageUrl = await resolveArtistImage(formData);
  const values = { id: 1, ...parsed.data, imageUrl };

  await db
    .insert(artistProfile)
    .values(values)
    .onConflictDoUpdate({
      target: artistProfile.id,
      set: {
        name: values.name,
        roles: values.roles,
        bio: values.bio,
        imageUrl: values.imageUrl,
        instagram: values.instagram,
        email: values.email,
        phone: values.phone,
        location: values.location,
        orderNote: values.orderNote,
      },
    });

  revalidatePath("/");
  revalidatePath("/admin/profile");
  redirect("/admin/profile?saved=1");
}
