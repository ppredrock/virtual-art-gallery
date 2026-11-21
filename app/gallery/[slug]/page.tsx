import { notFound } from "next/navigation";
import { GalleryViewer } from "@/components/gallery/GalleryViewer";
import { getSession } from "@/lib/auth";
import { listArtworks, getExhibitionBySlug, roomOf } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getExhibitionBySlug(slug);
  if (!data) notFound();

  if (data.exhibition.status !== "published") {
    const session = await getSession();
    if (session.user?.role !== "admin") notFound();
  }

  const used = new Set(data.placements.map((p) => p.artworkId));
  const artworks = (await listArtworks()).filter((a) => used.has(a.id));

  return (
    <GalleryViewer
      title={data.exhibition.title}
      room={roomOf(data.exhibition)}
      artworks={artworks}
      placements={data.placements}
    />
  );
}
