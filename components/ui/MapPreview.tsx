"use client";

import { mapsDirectionsUrl, mapsEmbedUrl, mapsSearchUrl } from "@/lib/maps";
import { MapPin } from "lucide-react";

export function MapPreview({ query, compact }: { query: string; compact?: boolean }) {
  if (!query.trim()) return null;
  return (
    <div className="space-y-2">
      {!compact ? (
        <iframe
          title="Mapa do endereço"
          src={mapsEmbedUrl(query)}
          className="w-full h-48 rounded-xl border"
          loading="lazy"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <a
          href={mapsSearchUrl(query)}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-sky-700 inline-flex items-center gap-1"
        >
          <MapPin className="size-3.5" />
          Ver no Maps
        </a>
        <a
          href={mapsDirectionsUrl(query)}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-sky-700"
        >
          Abrir rota
        </a>
      </div>
    </div>
  );
}
