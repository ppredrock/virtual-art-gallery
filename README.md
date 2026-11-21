# Virtual Gallery

A walkable 3D art gallery with an admin panel. Visitors walk through exhibitions in the browser; curators change the room, lighting and artwork layout from the admin, with a live 3D preview.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · three.js + react-three-fiber · Turso/libSQL + Drizzle · iron-session + bcrypt · Cloudinary (optional)

## Run it

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Notes |
|---|---|
| `SESSION_SECRET` | 32+ characters, e.g. `openssl rand -hex 32` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by the seed script to create the admin |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Leave empty to use a local `local.db` file |
| `CLOUDINARY_*` | Optional. Enables image upload; without it, paste an image URL |

```bash
npm run db:push   # create tables
npm run db:seed   # admin user + sample exhibition
npm run dev
```

Open `http://localhost:3000`. The admin is at `/admin`.

## Using it

- **Visitors:** `/` lists published exhibitions; `/gallery/<slug>` is the 3D room.
  - Desktop: `W A S D` to move, mouse to look, `Shift` to hurry, `Esc` to leave.
  - Mobile: drag the round pad to walk, drag anywhere else to look.
  - Walk up to a painting to read its details.
- **Admin:** manage artworks, then open an exhibition to edit the room (size, colours, lighting, start position) and place artworks on walls (position, height, width, frame). Changes show live in the preview and apply on Save. Draft exhibitions are hidden from visitors.

## Branding

Name and tagline: `lib/brand.ts`. Colours: the `@theme` block in `app/globals.css`.

## Layout

```
app/                  routes: landing, /gallery/[slug], /login, /admin
components/gallery/   3D scene, viewer, touch controls
components/admin/     exhibition editor, artwork form
lib/db/               Drizzle schema and client
lib/actions/          server actions (auth, artworks, exhibitions)
proxy.ts              guards /admin
scripts/seed.mjs      seed data
```

## Scripts

`dev` · `build` · `start` · `db:push` · `db:generate` · `db:studio` · `db:seed`
