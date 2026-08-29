import type { Store } from "@/lib/types";

function brazilNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const sunday = weekday.toLowerCase().startsWith("sun") || weekday.toLowerCase().startsWith("dom");
  return { minutes: hour * 60 + minute, sunday };
}

export function parseHoursRange(hours: string) {
  const match = hours.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return {
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
  };
}

export function isWithinOpeningHours(hours: string, now = new Date()) {
  const range = parseHoursRange(hours);
  if (!range) return true;
  const { minutes } = brazilNow(now);
  if (range.end >= range.start) {
    return minutes >= range.start && minutes < range.end;
  }
  return minutes >= range.start || minutes < range.end;
}

export function storeIsReceivingOrders(
  store: Pick<Store, "accepting_orders" | "paused_high_demand">,
) {
  return Boolean(store.accepting_orders && !store.paused_high_demand);
}

export function storeAvailability(
  store: Pick<Store, "accepting_orders" | "paused_high_demand">,
) {
  if (!store.accepting_orders) {
    return {
      receiving: false,
      label: "Fechada",
      reason: "A loja está fechada no momento. Você pode olhar o cardápio, mas ainda não dá para enviar pedido.",
    };
  }
  if (store.paused_high_demand) {
    return {
      receiving: false,
      label: "Pausada",
      reason: "Pausada por alta demanda. Tente novamente em alguns minutos.",
    };
  }
  return { receiving: true, label: "Aberta", reason: null as string | null };
}

export function extraDeliveryFees(
  store: Pick<Store, "extra_sunday_fee" | "extra_night_fee" | "night_starts_at">,
  now = new Date(),
) {
  const clock = brazilNow(now);
  const nightMatch = (store.night_starts_at || "22:00").match(/(\d{1,2}):(\d{2})/);
  const nightStarts = nightMatch
    ? Number(nightMatch[1]) * 60 + Number(nightMatch[2])
    : 22 * 60;
  const sunday = clock.sunday ? store.extra_sunday_fee ?? 0 : 0;
  const night = clock.minutes >= nightStarts ? store.extra_night_fee ?? 0 : 0;
  return { sunday, night, total: sunday + night };
}
