import type { Coupon } from "@/lib/types";

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function applyCoupon(
  coupon: Coupon | null,
  subtotal: number,
  isFirstOrder: boolean,
) {
  if (!coupon || !coupon.active) {
    return { discount: 0, error: null as string | null };
  }
  if (coupon.first_order_only && !isFirstOrder) {
    return { discount: 0, error: "Este cupom vale só na primeira compra." };
  }
  const discount =
    coupon.type === "percent"
      ? Math.min(subtotal, (subtotal * coupon.value) / 100)
      : Math.min(subtotal, coupon.value);
  return { discount: Math.round(discount * 100) / 100, error: null };
}
