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

// Remove the old placeholder (/samples/*.svg) content so the real artworks replace it.
const { rows: nonSample } = await client.execute(
  "SELECT COUNT(*) AS n FROM artworks WHERE image_url NOT LIKE '/samples/%'",
);
if (Number(nonSample[0].n) === 0) {
  await client.execute("DELETE FROM placements");
  await client.execute("DELETE FROM exhibitions WHERE slug = 'opening-show'");
  await client.execute("DELETE FROM artworks");
}

const { rows } = await client.execute("SELECT COUNT(*) AS n FROM artworks");
if (Number(rows[0].n) === 0) {
  const art = (file, title, medium) => ({
    title,
    artist: "Reena",
    year: "2026",
    medium,
    description: "",
    imageUrl: `/artworks/${file}.jpg`,
  });
  const works = [
    art("ghats", "Ghats of Kashi", "Acrylic on canvas"), // 1
    art("lady-in-hat", "Lady in the Floral Hat", "Acrylic on canvas"), // 2
    art("musicians", "Celebration", "Mixed media on paper"), // 3
    art("city-woman", "Woman of Monuments", "Mixed media on canvas"), // 4
    art("pink-path", "Blossom Path", "Acrylic on canvas"), // 5
    art("coin-tree", "Tree of Prosperity", "Acrylic and coins on canvas"), // 6
    art("warli", "Harvest Procession", "Warli art, acrylic on canvas"), // 7
    art("ganesha", "Blue Ganesha", "Acrylic on canvas"), // 8
    art("lanterns", "Lanterns and Blossoms", "Acrylic on paper"), // 9
    art("peacocks", "Lady with Peacocks", "Mixed media on paper"), // 10
    art("pottery", "The Potters", "Colour pencil and watercolour"), // 11
  ];
  for (const a of works) {
    await client.execute({
      sql: "INSERT INTO artworks (title, artist, year, medium, description, image_url) VALUES (?, ?, ?, ?, ?, ?)",
      args: [a.title, a.artist, a.year, a.medium, a.description, a.imageUrl],
    });
  }

  const ex = await client.execute({
    sql: "INSERT INTO exhibitions (slug, title, description, status) VALUES (?, ?, ?, 'published') RETURNING id",
    args: ["opening-show", "Opening Show", "Paintings by Reena. Edit the room and layout from the admin."],
  });
  const exhibitionId = Number(ex.rows[0].id);
  const { rows: ids } = await client.execute("SELECT id FROM artworks ORDER BY id");
  const layout = [
    // [index into works, wall, offset, elevation, width, frame]
    [0, "north", -4.5, 1.6, 2.6, "gold"],
    [1, "north", 0, 1.6, 1.7, "gold"],
    [2, "north", 4.5, 1.6, 2.6, "gold"],
    [3, "west", -4.5, 1.6, 1.5, "gold"],
    [4, "west", -1.5, 1.6, 2.2, "gold"],
    [5, "west", 1.5, 1.6, 1.8, "gold"],
    [6, "west", 4.5, 1.6, 2.2, "gold"],
    [7, "east", -4.5, 1.6, 1.6, "gold"],
    [8, "east", -1.5, 1.6, 2.2, "gold"],
    [9, "east", 1.5, 1.6, 1.7, "gold"],
    [10, "east", 4.5, 1.6, 2.2, "gold"],
  ];
  for (const [i, wall, offset, elevation, width, frame] of layout) {
    await client.execute({
      sql: "INSERT INTO placements (exhibition_id, artwork_id, wall, offset, elevation, width, frame) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [exhibitionId, Number(ids[i].id), wall, offset, elevation, width, frame],
    });
  }
}

console.log(`Seeded admin ${email} and the artwork exhibition.`);
client.close();
