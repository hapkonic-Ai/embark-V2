import { useState, useRef } from "react";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";

const ACCEPTED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_IMAGE_MIMES.includes(file.type)) {
      setError("Only JPG, PNG, GIF or WebP images are allowed.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 5 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setIsLoading(true);
    try {
      const dataUrl = await fileToBase64(file);
      onChange(dataUrl);
    } catch {
      setError("Could not read the image. Please try another file.");
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewUrl = value || "";

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt={label}
            className="h-32 w-32 rounded-2xl object-cover border"
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <label
          className={`flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 text-muted-foreground transition-colors hover:bg-muted ${
            disabled || isLoading ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span className="mt-1.5 text-xs">Upload</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={disabled || isLoading}
          />
        </label>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
      <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP — max 5 MB</p>
    </div>
  );
}
