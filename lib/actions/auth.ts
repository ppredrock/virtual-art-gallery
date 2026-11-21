"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db, users } from "@/lib/db";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  const ok = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !ok) return { error: "Invalid email or password." };

  const session = await getSession();
  session.user = { id: user.id, email: user.email, role: user.role };
  await session.save();
  redirect("/admin");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
