export const STORE_CITY = "Bertioga - SP";

export function fullDeliveryAddress(
  address: string | null | undefined,
  neighborhood?: string | null,
  city = STORE_CITY,
) {
  return [address?.trim(), neighborhood?.trim(), city].filter(Boolean).join(", ");
}

export function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsDirectionsUrl(query: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function mapsEmbedUrl(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}
