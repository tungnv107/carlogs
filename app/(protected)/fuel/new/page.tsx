import Link from "next/link";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";
import { FuelForm } from "@/components/forms/fuel-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewFuel({ searchParams }: { searchParams: Promise<{ vehicleId?: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "DRIVER"]);
  const { vehicleId } = await searchParams;
  const vehicles = await prisma.vehicle.findMany({ where: { organizationId: organization.id, status: { not: "ARCHIVED" }, ...vehicleScope(membership.role, user.id) }, orderBy: { name: "asc" } });
  const time = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).replace(" ", "T");
  return <section className="mx-auto max-w-2xl space-y-5"><Link href="/fuel" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700">← Nhiên liệu và sạc</Link><PageHeader eyebrow="GIAO DỊCH VẬN HÀNH" title="Ghi nhiên liệu / sạc điện" description="Ghi lượng nhiên liệu, đơn giá và số km. Chi phí được ghi vào sổ một lần."/>
    {vehicles.length ? <FuelForm vehicles={vehicles.map(v => ({ id: v.id, label: `${v.plate} · ${v.name}`, fuelType: v.fuelType }))} initialTime={time} keyId={randomUUID()} selectedVehicle={vehicles.some(v => v.id === vehicleId) ? vehicleId : undefined}/> : <p className="card muted">Không có xe trong phạm vi được phân công.</p>}
  </section>;
}
