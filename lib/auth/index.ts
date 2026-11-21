import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "./session";

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.user || session.user.role !== "admin") redirect("/login");
  return session.user;
}
