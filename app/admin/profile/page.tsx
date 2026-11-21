import { saveArtistProfile } from "@/lib/actions/profile";
import { cloudinaryEnabled } from "@/lib/cloudinary";
import { getArtistProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const profile = await getArtistProfile();
  const hasCloudinary = cloudinaryEnabled();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-royal-900">Artist &amp; Contact</h1>
        <p className="mt-1 text-sm text-royal-800/75">
          Update the artist portrait, bio, and contact details shown on the home page.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {saved && <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Artist profile saved.</div>}

      <form action={saveArtistProfile} className="card grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-4 border-b border-gold-300/40 pb-5 sm:col-span-2 sm:flex-row">
          <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-gold-500/70 bg-royal-950 shadow">
            {profile.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.imageUrl} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-center text-[10px] uppercase tracking-widest text-gold-300/70">
                <span className="font-display text-2xl italic text-gold-300">{profile.name.slice(0, 1)}</span>
                <span>No photo</span>
              </div>
            )}
          </div>
          <div className="w-full space-y-2">
            <label className="label">Upload artist portrait {hasCloudinary ? "" : "(up to 900 KB)"}</label>
            <input name="image" type="file" accept="image/*" className="input" />
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs text-royal-700/70">Or paste an image URL below</span>
              {profile.imageUrl && (
                <label className="flex items-center gap-1.5 text-xs text-red-700">
                  <input type="checkbox" name="removeImage" />
                  Remove current photo
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Image URL</label>
          <input
            name="imageUrl"
            defaultValue={profile.imageUrl}
            placeholder="https://… (leave blank to show the artist placeholder)"
            className="input"
          />
        </div>

        <div>
          <label className="label">Artist name</label>
          <input name="name" required defaultValue={profile.name} className="input" />
        </div>
        <div>
          <label className="label">Roles / Subtitle</label>
          <input name="roles" defaultValue={profile.roles} placeholder="Artist · Painter · Dreamer" className="input" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Bio / Story</label>
          <textarea name="bio" rows={3} defaultValue={profile.bio} className="input" />
        </div>

        <div>
          <label className="label">Instagram (DM for orders)</label>
          <input name="instagram" defaultValue={profile.instagram} placeholder="@mimisbrushstrokes" className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" defaultValue={profile.email} placeholder="hello@mimisbrushstrokes.com" className="input" />
        </div>

        <div>
          <label className="label">Phone / WhatsApp</label>
          <input name="phone" defaultValue={profile.phone} placeholder="+91 98XXX XXXXX" className="input" />
        </div>
        <div>
          <label className="label">Location / Shipping</label>
          <input name="location" defaultValue={profile.location} placeholder="India · Worldwide Shipping" className="input" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Orders &amp; Commissions Note</label>
          <textarea name="orderNote" rows={2} defaultValue={profile.orderNote} className="input" />
        </div>

        <div className="sm:col-span-2">
          <button className="btn-gold">Save artist &amp; contact</button>
        </div>
      </form>
    </div>
  );
}
