import { requireOrganizationAccess } from "@/modules/auth/guards";
import { AppShell } from "@/components/layout/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, organization } = await requireOrganizationAccess();
  return <AppShell user={user} organizationId={organization.id} organizationName={organization.name}>{children}</AppShell>;
}
