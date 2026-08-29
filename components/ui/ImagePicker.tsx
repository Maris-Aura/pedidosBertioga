"use client";

import { useRef, useState } from "react";
import { fileToDataUrl } from "@/lib/image";
import { ImagePlus, Trash2 } from "lucide-react";

export function ImagePicker({
  value,
  onChange,
  label,
  kind = "photo",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  kind?: "logo" | "photo";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showLink, setShowLink] = useState(Boolean(value) && !value.startsWith("data:"));

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file, {
        maxSize: kind === "logo" ? 512 : 900,
        quality: 0.82,
      });
      onChange(dataUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível converter a foto.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <div className="text-xs font-bold">{label}</div>
      <div className="flex items-start gap-3">
        <div className="size-16 rounded-xl border bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5 text-gray-400" />
          )}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void onFile(event.target.files?.[0]);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg disabled:opacity-60"
            >
              {busy ? "Convertendo..." : "Escolher foto"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-xs font-bold text-red-600 inline-flex items-center gap-1"
              >
                <Trash2 className="size-3.5" />
                Remover
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowLink((current) => !current)}
              className="text-xs font-bold text-slate-600"
            >
              {showLink ? "Ocultar link" : "Ou colar um link"}
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            A foto é reduzida sozinha para caber no cardápio. Não precisa de link.
          </p>
          {error ? <p className="text-[11px] text-red-600 font-bold">{error}</p> : null}
        </div>
      </div>
      {showLink ? (
        <input
          value={value.startsWith("data:") ? "" : value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://... (opcional)"
          className="w-full border rounded-lg p-2 text-sm"
        />
      ) : null}
    </div>
  );
}
