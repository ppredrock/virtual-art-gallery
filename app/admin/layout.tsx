import Link from "next/link";
import { Crest } from "@/components/Crest";
import { logout } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header className="royal-panel border-b-2 border-gold-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/admin" className="flex items-center gap-2">
              <Crest className="h-8 w-8" />
              <span className="text-xl font-semibold tracking-wide text-gold-200 font-[family-name:var(--font-display)]">{BRAND.name}</span>
            </Link>
            <Link href="/admin" className="text-royal-100 hover:text-gold-300">
              Exhibitions
            </Link>
            <Link href="/admin/artworks" className="text-royal-100 hover:text-gold-300">
              Artworks
            </Link>
            <Link href="/" className="text-royal-100 hover:text-gold-300">
              View site
            </Link>
          </nav>
          <form action={logout} className="flex items-center gap-3 text-sm text-royal-200">
            <span>{user.email}</span>
            <button className="btn">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
