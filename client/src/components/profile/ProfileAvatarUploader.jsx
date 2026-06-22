import { useRef, useState } from "react";
import { getInitials } from "../../utils/formatters";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxOriginalSize = 5 * 1024 * 1024;
const maxCompressedSize = 500 * 1024;
const delay = () => new Promise((resolve) => window.setTimeout(resolve, 0));

const dataUrlSize = (dataUrl) => {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
};

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });

const compressAvatar = async (file) => {
  if (!allowedTypes.has(file.type)) throw new Error("Upload a PNG, JPG, or WebP image.");
  if (file.size > maxOriginalSize) throw new Error("Choose an image under 5MB.");

  const source = await readFile(file);
  const image = await loadImage(source);
  const maxSize = 512;
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.86;
  let output = canvas.toDataURL("image/webp", quality);
  while (dataUrlSize(output) > maxCompressedSize && quality > 0.42) {
    quality -= 0.08;
    await delay();
    output = canvas.toDataURL("image/webp", quality);
  }

  if (dataUrlSize(output) > maxCompressedSize) {
    throw new Error("Avatar is still larger than 500KB after compression.");
  }

  return output;
};

const ProfileAvatarUploader = ({ user, profile, steamSummary, onUpload, onRemove, compact = false, variant = "default" }) => {
  const inputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const displayName = profile?.displayName || user?.name || steamSummary?.displayName || "Player";
  const customAvatar = profile?.customAvatar?.dataUrl;
  const avatar = customAvatar || steamSummary?.avatar || user?.avatar;

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSaving(true);
    setError("");
    try {
      const dataUrl = await compressAvatar(file);
      await onUpload(dataUrl);
    } catch (uploadError) {
      setError(uploadError.message || "Could not save avatar.");
    } finally {
      setSaving(false);
    }
  };

  if (variant === "hero") {
    return (
      <div className="relative mx-auto w-fit">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-clutch-panelSoft text-3xl font-black text-clutch-text transition hover:border-white/25 sm:h-28 sm:w-28 md:h-32 md:w-32 md:text-4xl"
          aria-label="Upload profile avatar"
          disabled={saving}
        >
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(displayName)}
          <span className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white opacity-0 transition group-hover:opacity-100">
            {saving ? "Saving" : "Edit"}
          </span>
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
        {error && <p className="mt-3 max-w-44 text-center text-xs leading-5 text-clutch-red">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`flex ${compact ? "flex-col items-center gap-3" : "flex-col items-center gap-4"}`}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-clutch-border bg-clutch-panelSoft font-bold text-clutch-text transition hover:border-zinc-500 ${
          compact ? "h-32 w-32 text-4xl md:h-36 md:w-36" : "h-32 w-32 text-3xl md:h-36 md:w-36"
        }`}
        aria-label="Upload profile avatar"
      >
        {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : getInitials(displayName)}
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
      <div className={compact ? "w-full min-w-0 text-center" : "text-center"}>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => inputRef.current?.click()} disabled={saving}>
            {saving ? "Saving..." : "Upload photo"}
          </button>
          {customAvatar && (
            <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={onRemove} disabled={saving}>
              Remove
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-clutch-red">{error}</p>}
        {!compact && <p className="mt-2 text-xs text-clutch-muted">PNG, JPG, or WebP. Stored compressed under 500KB.</p>}
      </div>
    </div>
  );
};

export default ProfileAvatarUploader;
