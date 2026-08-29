import { CustomerHistory } from "@/components/client/CustomerHistory";

export default async function CustomerAccountPage({
  params,
}: PageProps<"/[storeSlug]/conta">) {
  const { storeSlug } = await params;
  return <CustomerHistory storeSlug={storeSlug} />;
}
