import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";
import { TripForm } from "@/components/forms/trip-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewTrip({ searchParams }: { searchParams: Promise<{ vehicleId?: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "DRIVER"]);
  const params = await searchParams;
  const [vehicles, members] = await Promise.all([
    prisma.vehicle.findMany({ where: { organizationId: organization.id, status: { not: "ARCHIVED" }, ...vehicleScope(membership.role, user.id) } }),
    prisma.organizationMember.findMany({ where: { organizationId: organization.id, status: "ACTIVE" }, include: { user: { select: { name: true, email: true } } } })
  ]);
  const time = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).replace(" ", "T");
  return <section className="mx-auto max-w-2xl space-y-5"><Link href="/trips" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700">← Hành trình</Link><PageHeader eyebrow="NHẬT KÝ VẬN HÀNH" title="Ghi hành trình" description="Ghi chính xác xe, tài xế, thời gian và số km bắt đầu/kết thúc."/>{vehicles.length ? <TripForm vehicles={vehicles.map(v => ({ id: v.id, label: `${v.plate} · ${v.name}` }))} drivers={members.map(m => ({ id: m.userId, label: m.user.name ?? m.user.email ?? m.userId }))} initialTime={time} selectedVehicle={vehicles.some(v => v.id === params.vehicleId) ? params.vehicleId : undefined}/> : <p className="card muted">Không có xe được phép ghi hành trình.</p>}</section>;
}
