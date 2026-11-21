import Link from "next/link";
import { Crest } from "@/components/Crest";
import { BRAND } from "@/lib/brand";
import { listPublishedExhibitions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const exhibitions = await listPublishedExhibitions();

  return (
    <div className="min-h-dvh">
      <header className="royal-panel border-b-2 border-gold-500">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <Crest className="mx-auto h-16 w-16" />
          <h1 className="mt-6 text-5xl font-semibold tracking-wide text-gold-200 sm:text-6xl">{BRAND.name}</h1>
          <div className="gold-rule mt-6" />
          <p className="mt-5 font-[family-name:var(--font-display)] text-xl italic text-royal-100 sm:text-2xl">{BRAND.tagline}</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-3xl font-semibold text-royal-900">Current exhibitions</h2>
        <div className="gold-rule mt-4" />

        {exhibitions.length === 0 ? (
          <p className="mt-10 text-center text-royal-700">No exhibitions are open yet.</p>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {exhibitions.map((e) => (
              <li key={e.id}>
                <Link href={`/gallery/${e.slug}`} className="card group block p-6 transition hover:-translate-y-0.5 hover:border-gold-500">
                  <h3 className="text-2xl font-semibold text-royal-900">{e.title}</h3>
                  {e.description && <p className="mt-2 line-clamp-3 text-sm text-royal-800/80">{e.description}</p>}
                  <span className="mt-5 inline-block text-sm font-semibold uppercase tracking-[0.16em] text-gold-700 group-hover:text-royal-700">
                    Enter the gallery →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="border-t border-gold-300/60 py-8 text-center text-xs uppercase tracking-[0.2em] text-royal-600">
        <Link href="/admin" className="hover:text-gold-700">
          Curator access
        </Link>
      </footer>
    </div>
  );
}
