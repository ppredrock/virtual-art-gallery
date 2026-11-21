import type { SessionOptions } from "iron-session";

export type SessionData = {
  user?: { id: number; email: string; role: "admin" | "curator" };
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "",
  cookieName: "vg_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};
