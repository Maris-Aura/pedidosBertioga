import { CheckoutForm } from "@/components/client/CheckoutForm";

export default async function CheckoutPage({
  params,
}: PageProps<"/[storeSlug]/checkout">) {
  const { storeSlug } = await params;
  return <CheckoutForm storeSlug={storeSlug} />;
}
