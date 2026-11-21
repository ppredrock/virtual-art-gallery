import Link from "next/link";
import { createExhibition, deleteExhibition } from "@/lib/actions/exhibitions";
import { listExhibitions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const exhibitions = await listExhibitions();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Exhibitions</h1>
        <form action={createExhibition} className="flex gap-2">
          <input name="title" required placeholder="New exhibition title" className="input w-64" />
          <button className="btn">Create</button>
        </form>
      </div>

      <ul className="space-y-3">
        {exhibitions.map((e) => (
          <li key={e.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">{e.title}</div>
              <div className="text-sm text-neutral-500">
                /gallery/{e.slug} ·{" "}
                <span className={e.status === "published" ? "text-green-700" : "text-amber-700"}>{e.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/gallery/${e.slug}`} className="btn-ghost">
                View
              </Link>
              <Link href={`/admin/exhibitions/${e.id}`} className="btn">
                Edit room & layout
              </Link>
              <form action={deleteExhibition.bind(null, e.id)}>
                <button className="btn-danger">Delete</button>
              </form>
            </div>
          </li>
        ))}
        {exhibitions.length === 0 && <li className="text-neutral-500">No exhibitions yet.</li>}
      </ul>
    </div>
  );
}
