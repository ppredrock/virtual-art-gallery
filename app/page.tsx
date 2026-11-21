import Link from "next/link";
import { Crest } from "@/components/Crest";
import { BRAND } from "@/lib/brand";
import { getArtistProfile, listPublishedExhibitionsWithPreviews } from "@/lib/queries";

export const dynamic = "force-dynamic";

function instagramHref(handle: string) {
  const clean = handle.trim();
  if (!clean) return null;
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `https://instagram.com/${clean.replace(/^@/, "")}`;
}

export default async function Home() {
  const [exhibitions, artist] = await Promise.all([
    listPublishedExhibitionsWithPreviews(),
    getArtistProfile(),
  ]);
  const igUrl = instagramHref(artist.instagram);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="royal-panel relative overflow-hidden border-b-2 border-gold-500">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_0%,rgb(233_208_112/0.16),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <div className="inline-flex items-center gap-3 rounded-full border border-gold-500/35 bg-royal-950/50 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-gold-200 backdrop-blur">
            {BRAND.roles}
          </div>
          <Crest className="mx-auto mt-6 h-16 w-16 drop-shadow-[0_4px_16px_rgba(201,162,39,0.35)]" />
          <h1 className="mt-5 text-5xl font-semibold tracking-wide text-gold-200 sm:text-7xl">{BRAND.name}</h1>
          <div className="gold-rule mt-6" />
          <p className="font-display mx-auto mt-5 max-w-2xl text-xl italic text-royal-100/95 sm:text-2xl">
            {BRAND.shortTagline}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-20 px-4 py-14 sm:py-16">
        <section>
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-700">On View</span>
            <h2 className="mt-1 text-3xl font-semibold text-royal-900 sm:text-4xl">Current exhibitions</h2>
            <div className="gold-rule mt-4" />
          </div>

          {exhibitions.length === 0 ? (
            <p className="mt-12 text-center text-royal-700">No exhibitions are open yet.</p>
          ) : (
            <ul className={`mt-10 grid gap-8 ${exhibitions.length === 1 ? "mx-auto max-w-2xl" : "sm:grid-cols-2"}`}>
              {exhibitions.map((e) => {
                const previews = e.artworks.slice(0, 4);
                return (
                  <li key={e.id}>
                    <Link
                      href={`/gallery/${e.slug}`}
                      className="card group block overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-gold-500 hover:shadow-[0_20px_44px_-16px_rgb(36_15_82/0.28)]"
                    >
                      {previews.length > 0 && (
                        <div className="grid grid-cols-4 gap-1.5 border-b border-gold-300/50 bg-royal-950 p-2.5">
                          {previews.map((art) => (
                            <div
                              key={art.artworkId}
                              className="relative aspect-[4/5] overflow-hidden rounded-sm border border-gold-500/40 bg-royal-900"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={art.imageUrl}
                                alt={art.title}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-6 sm:p-7">
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
                          <span>
                            {e.artworks.length} {e.artworks.length === 1 ? "Work" : "Works"} on View
                          </span>
                          <span>3D Room</span>
                        </div>
                        <h3 className="mt-2 text-3xl font-semibold text-royal-900">{e.title}</h3>
                        {e.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-royal-800/80">{e.description}</p>}
                        <div className="mt-6 flex items-center justify-between border-t border-gold-300/40 pt-4">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700 transition group-hover:text-royal-800">
                            Step inside the gallery
                          </span>
                          <span className="text-lg text-gold-600 transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Artist & Contact section */}
        <section className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-700">Behind the Canvas</span>
            <h2 className="mt-1 text-3xl font-semibold text-royal-900 sm:text-4xl">Meet the Artist</h2>
            <div className="gold-rule mt-4" />
          </div>

          <div className="card mt-10 overflow-hidden p-0 sm:grid sm:grid-cols-[260px_1fr]">
            <div className="relative flex min-h-[280px] items-center justify-center border-b border-gold-300/50 bg-gradient-to-br from-royal-950 via-royal-900 to-royal-800 p-6 sm:border-b-0 sm:border-r">
              {artist.imageUrl ? (
                <div className="aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-xl border-2 border-gold-400/80 shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artist.imageUrl} alt={artist.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-[4/5] w-full max-w-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gold-400/60 bg-royal-950/50 p-5 text-center">
                  <svg viewBox="0 0 64 64" className="h-14 w-14 text-gold-300/80" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="32" cy="23" r="10" />
                    <path d="M14 54c2-10 9-15 18-15s16 5 18 15" strokeLinecap="round" />
                  </svg>
                  <span className="font-display mt-3 text-lg italic text-gold-200">{artist.name}</span>
                  <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-royal-200/70">Portrait coming soon</span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">{artist.roles}</div>
                <h3 className="mt-1 text-3xl font-semibold text-royal-900">{artist.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-royal-800/85">{artist.bio}</p>
                {artist.orderNote && (
                  <p className="mt-3 rounded-lg border border-gold-300/60 bg-ivory px-3.5 py-2.5 text-xs leading-relaxed text-royal-900">
                    <span className="font-semibold uppercase tracking-[0.14em] text-gold-700">Orders &amp; Commissions · </span>
                    {artist.orderNote}
                  </p>
                )}
              </div>

              <div className="mt-6 grid gap-2.5 border-t border-gold-300/40 pt-5 text-sm sm:grid-cols-2">
                {artist.instagram && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-royal-600">Instagram · DM for Orders</span>
                    {igUrl ? (
                      <a href={igUrl} target="_blank" rel="noreferrer" className="font-medium text-royal-900 hover:text-gold-700">
                        {artist.instagram}
                      </a>
                    ) : (
                      <span className="font-medium text-royal-900">{artist.instagram}</span>
                    )}
                  </div>
                )}
                {artist.email && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-royal-600">Email</span>
                    <a href={`mailto:${artist.email}`} className="font-medium text-royal-900 hover:text-gold-700">
                      {artist.email}
                    </a>
                  </div>
                )}
                {artist.phone && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-royal-600">Phone / WhatsApp</span>
                    <span className="font-medium text-royal-900">{artist.phone}</span>
                  </div>
                )}
                {artist.location && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-royal-600">Studio</span>
                    <span className="font-medium text-royal-900">{artist.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gold-300/60 py-8 text-center text-xs uppercase tracking-[0.2em] text-royal-600">
        <Link href="/admin" className="hover:text-gold-700">
          Curator access
        </Link>
      </footer>
    </div>
  );
}
