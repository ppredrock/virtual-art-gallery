import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "curator"] }).notNull().default("admin"),
  createdAt: createdAt(),
});

export const artworks = sqliteTable("artworks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  artist: text("artist").notNull().default(""),
  year: text("year").notNull().default(""),
  medium: text("medium").notNull().default(""),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull(),
  createdAt: createdAt(),
});

export const exhibitions = sqliteTable("exhibitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  roomWidth: real("room_width").notNull().default(14),
  roomLength: real("room_length").notNull().default(18),
  roomHeight: real("room_height").notNull().default(4.5),
  wallColor: text("wall_color").notNull().default("#5a3a96"),
  floorColor: text("floor_color").notNull().default("#2a1e40"),
  ceilingColor: text("ceiling_color").notNull().default("#f6efe0"),
  lightColor: text("light_color").notNull().default("#ffe7b0"),
  lightIntensity: real("light_intensity").notNull().default(1),
  spawnX: real("spawn_x").notNull().default(0),
  spawnZ: real("spawn_z").notNull().default(6),
  createdAt: createdAt(),
});

export const placements = sqliteTable("placements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exhibitionId: integer("exhibition_id")
    .notNull()
    .references(() => exhibitions.id, { onDelete: "cascade" }),
  artworkId: integer("artwork_id")
    .notNull()
    .references(() => artworks.id, { onDelete: "cascade" }),
  wall: text("wall", { enum: ["north", "south", "east", "west"] }).notNull().default("north"),
  offset: real("offset").notNull().default(0),
  elevation: real("elevation").notNull().default(1.6),
  width: real("width").notNull().default(1.6),
  frame: text("frame", { enum: ["none", "thin", "gold", "black"] }).notNull().default("thin"),
});

export const artistProfile = sqliteTable("artist_profile", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default("Mimi"),
  roles: text("roles").notNull().default("Artist · Painter · Dreamer"),
  bio: text("bio").notNull().default("Hand-painted creations inspired by art and divine divinity. DM for orders."),
  imageUrl: text("image_url").notNull().default(""),
  instagram: text("instagram").notNull().default("@mimisbrushstrokes"),
  email: text("email").notNull().default("hello@mimisbrushstrokes.com"),
  phone: text("phone").notNull().default("+91 98XXX XXXXX"),
  location: text("location").notNull().default("India · Worldwide Shipping"),
  orderNote: text("order_note").notNull().default("DM on Instagram or reach out via email for custom commissions and available originals."),
});
