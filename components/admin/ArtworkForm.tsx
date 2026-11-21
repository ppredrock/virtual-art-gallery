import { cloudinaryEnabled } from "@/lib/cloudinary";

type Defaults = {
  title?: string;
  artist?: string;
  year?: string;
  medium?: string;
  description?: string;
  imageUrl?: string;
};

export function ArtworkForm({
  action,
  defaults = {},
  submitLabel,
  imageOptional = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Defaults;
  submitLabel: string;
  imageOptional?: boolean;
}) {
  const canUpload = cloudinaryEnabled();

  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Title</label>
        <input name="title" required defaultValue={defaults.title} className="input" />
      </div>
      <div>
        <label className="label">Artist</label>
        <input name="artist" defaultValue={defaults.artist} className="input" />
      </div>
      <div>
        <label className="label">Year</label>
        <input name="year" defaultValue={defaults.year} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Medium</label>
        <input name="medium" defaultValue={defaults.medium} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Description</label>
        <textarea name="description" rows={3} defaultValue={defaults.description} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Image URL {imageOptional && "(leave as is to keep current)"}</label>
        <input
          name="imageUrl"
          type="url"
          defaultValue={defaults.imageUrl}
          required={!imageOptional && !canUpload}
          placeholder="https://…"
          className="input"
        />
      </div>
      {canUpload && (
        <div className="sm:col-span-2">
          <label className="label">…or upload an image</label>
          <input name="image" type="file" accept="image/*" className="input" />
        </div>
      )}
      <div className="sm:col-span-2">
        <button className="btn">{submitLabel}</button>
      </div>
    </form>
  );
}
