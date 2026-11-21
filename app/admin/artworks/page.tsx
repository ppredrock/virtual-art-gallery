import Link from "next/link";
import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { createArtwork, deleteArtwork } from "@/lib/actions/artworks";
import { listArtworks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ArtworksPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const artworks = await listArtworks();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Artworks</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Add artwork</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <ArtworkForm action={createArtwork} submitLabel="Add artwork" />
      </section>

      <section>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((a) => (
            <li key={a.id} className="card flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.imageUrl} alt={a.title} className="h-24 w-20 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{a.title}</div>
                <div className="truncate text-sm text-neutral-500">{[a.artist, a.year].filter(Boolean).join(" · ")}</div>
                <div className="mt-2 flex gap-2">
                  <Link href={`/admin/artworks/${a.id}`} className="btn-ghost">
                    Edit
                  </Link>
                  <form action={deleteArtwork.bind(null, a.id)}>
                    <button className="btn-danger">Delete</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
