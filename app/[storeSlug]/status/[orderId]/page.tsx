import { OrderStatusTracker } from "@/components/client/OrderStatusTracker";

export default async function OrderStatusPage({
  params,
}: PageProps<"/[storeSlug]/status/[orderId]">) {
  const { storeSlug, orderId } = await params;
  return <OrderStatusTracker storeSlug={storeSlug} orderId={orderId} />;
}
