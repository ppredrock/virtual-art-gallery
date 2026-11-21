import { config } from "dotenv";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local");

const passwordHash = await bcrypt.hash(password, 12);
await client.execute({
  sql: `INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin')
        ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`,
  args: [email, passwordHash],
});

const { rows } = await client.execute("SELECT COUNT(*) AS n FROM artworks");
if (Number(rows[0].n) === 0) {
  const art = (n, title, artist, year, medium) => ({
    title,
    artist,
    year,
    medium,
    description: "Placeholder artwork. Replace it from the admin.",
    imageUrl: `/samples/art-${n}.svg`,
  });
  const samples = [
    art(1, "Morning Fields", "A. Sample", "2021", "Oil on canvas"),
    art(2, "Harbour Light", "A. Sample", "2022", "Acrylic"),
    art(3, "Quiet Hours", "B. Sample", "2020", "Gouache"),
    art(4, "Terraces", "B. Sample", "2023", "Mixed media"),
    art(5, "Low Tide", "C. Sample", "2019", "Watercolour"),
    art(6, "Understory", "C. Sample", "2024", "Oil on panel"),
  ];
  for (const a of samples) {
    await client.execute({
      sql: "INSERT INTO artworks (title, artist, year, medium, description, image_url) VALUES (?, ?, ?, ?, ?, ?)",
      args: [a.title, a.artist, a.year, a.medium, a.description, a.imageUrl],
    });
  }

  const ex = await client.execute({
    sql: "INSERT INTO exhibitions (slug, title, description, status) VALUES (?, ?, ?, 'published') RETURNING id",
    args: ["opening-show", "Opening Show", "A sample exhibition. Edit the room and layout from the admin."],
  });
  const exhibitionId = Number(ex.rows[0].id);
  const layout = [
    [1, "north", -3.5, 1.7, 2.2, "gold"],
    [2, "north", 3.5, 1.7, 2.2, "gold"],
    [3, "west", -4, 1.6, 1.8, "gold"],
    [4, "west", 3, 1.6, 1.8, "gold"],
    [5, "east", -4, 1.6, 1.8, "gold"],
    [6, "east", 3, 1.6, 1.8, "gold"],
  ];
  for (const [artworkId, wall, offset, elevation, width, frame] of layout) {
    await client.execute({
      sql: "INSERT INTO placements (exhibition_id, artwork_id, wall, offset, elevation, width, frame) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [exhibitionId, artworkId, wall, offset, elevation, width, frame],
    });
  }
}

console.log(`Seeded admin ${email} and sample exhibition.`);
client.close();
