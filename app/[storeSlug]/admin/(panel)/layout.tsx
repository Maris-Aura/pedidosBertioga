import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminPanelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  return <AdminShell storeSlug={storeSlug}>{children}</AdminShell>;
}
