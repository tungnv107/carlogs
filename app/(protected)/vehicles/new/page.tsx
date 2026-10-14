import { requireOrganizationAccess } from "@/modules/auth/guards";
import { VehicleForm } from "@/components/forms/vehicle-form";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewVehicle() {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const members = await prisma.organizationMember.findMany({ where: { organizationId: organization.id, status: "ACTIVE" }, include: { user: true } });
  return <section className="mx-auto max-w-3xl space-y-5"><Link href="/vehicles" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700">← Danh sách xe</Link><PageHeader eyebrow="QUẢN LÝ PHƯƠNG TIỆN" title="Thêm phương tiện" description="Thiết lập hồ sơ xe, người phụ trách và số km ban đầu."/><VehicleForm assignees={members.map(m => ({ id: m.userId, name: m.user.name ?? m.user.email ?? m.userId }))}/></section>;
}
