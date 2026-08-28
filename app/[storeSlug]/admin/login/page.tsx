import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage({
  params,
}: PageProps<"/[storeSlug]/admin/login">) {
  const { storeSlug } = await params;
  return <AdminLoginForm storeSlug={storeSlug} />;
}
