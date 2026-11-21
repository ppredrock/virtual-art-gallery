import { notFound } from "next/navigation";
import { ExhibitionEditor } from "@/components/admin/ExhibitionEditor";
import { getExhibitionById, listArtworks, roomOf } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditExhibition({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const data = Number.isInteger(id) ? await getExhibitionById(id) : null;
  if (!data) notFound();
  const artworks = await listArtworks();

  return (
    <ExhibitionEditor
      id={data.exhibition.id}
      initial={{
        title: data.exhibition.title,
        slug: data.exhibition.slug,
        description: data.exhibition.description,
        status: data.exhibition.status,
        room: roomOf(data.exhibition),
        placements: data.placements.map((p) => ({
          id: p.id,
          artworkId: p.artworkId,
          wall: p.wall,
          offset: p.offset,
          elevation: p.elevation,
          width: p.width,
          frame: p.frame,
        })),
      }}
      artworks={artworks}
    />
  );
}
