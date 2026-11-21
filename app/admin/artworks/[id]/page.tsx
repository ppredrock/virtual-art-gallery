import { notFound } from "next/navigation";
import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { updateArtwork } from "@/lib/actions/artworks";
import { getArtwork } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditArtwork({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const id = Number((await params).id);
  const { error } = await searchParams;
  const artwork = Number.isInteger(id) ? await getArtwork(id) : null;
  if (!artwork) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Edit artwork</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ArtworkForm action={updateArtwork.bind(null, id)} defaults={artwork} submitLabel="Save changes" imageOptional />
    </div>
  );
}
