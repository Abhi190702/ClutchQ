import { useRef, useState } from "react";
import { formatNumber } from "../../utils/formatters";

const maxOriginalSize = 5 * 1024 * 1024;
const maxCompressedSize = 900 * 1024;
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const delay = () => new Promise((resolve) => setTimeout(resolve, 0));

const dataUrlSize = (dataUrl) => {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
};

const loadImage = (dataUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read image."));
    image.src = dataUrl;
  });

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });

const compressImage = async (file) => {
  const original = await readFile(file);
  const image = await loadImage(original);
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.86;
  let output = canvas.toDataURL("image/webp", quality);
  while (dataUrlSize(output) > maxCompressedSize && quality > 0.42) {
    quality -= 0.08;
    await delay();
    output = canvas.toDataURL("image/webp", quality);
  }

  if (dataUrlSize(output) > maxCompressedSize) {
    throw new Error("Image is still over 900KB after compression.");
  }

  return output;
};

const ScorecardUploader = ({ value, onChange }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const chooseFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    if (!file) return;
    if (!allowedTypes.has(file.type)) {
      setError("Use PNG, JPG, or WebP.");
      return;
    }
    if (file.size > maxOriginalSize) {
      setError("Original image must be under 5MB.");
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      onChange?.({
        dataUrl,
        sizeBytes: dataUrlSize(dataUrl),
        mime: "image/webp",
        name: file.name
      });
    } catch (uploadError) {
      setError(uploadError.message || "Could not compress image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-black text-white">Scorecard image</div>
          <p className="mt-1 text-sm text-zinc-400">Optional. Stored compressed under 900KB.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary py-2" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? "Compressing..." : "Choose image"}
          </button>
          {value?.dataUrl ? (
            <button type="button" className="btn-secondary py-2" onClick={() => onChange?.(null)}>
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={chooseFile} />
      {error ? <div className="mt-3 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
      {value?.dataUrl ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
          <img src={value.dataUrl} alt="Scorecard preview" className="h-28 w-full rounded-lg object-cover sm:w-40" />
          <div className="text-sm text-zinc-400">
            <div className="font-bold text-white">{value.name || "Compressed scorecard"}</div>
            <div className="mt-1">{formatNumber(value.sizeBytes)} bytes · WebP preview</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ScorecardUploader;
