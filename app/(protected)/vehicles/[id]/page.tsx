import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { archiveVehicle } from "@/modules/vehicles/actions";
import { formatVND } from "@/lib/finance";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { vehicleScope, canCreateExpense } from "@/lib/access-scope";
import { OdometerCorrectionForm } from "@/components/forms/trip-form";
import { CarFront, CalendarClock, Fuel, Gauge, Pencil, ReceiptText, Route } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui/page-header";

export default async function VehicleDetails({ params }: { params: Promise<{ id: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, organizationId: organization.id, ...vehicleScope(membership.role, user.id) }, include: { assignedTo: { select: { name: true, email: true } } } });
  if (!vehicle) notFound();
  const [total, recent] = await Promise.all([
    prisma.expense.aggregate({ where: { vehicleId: id, organizationId: organization.id, status: "POSTED" }, _sum: { amount: true } }),
    prisma.expense.findMany({ where: { vehicleId: id, organizationId: organization.id }, include: { category: true }, orderBy: { occurredAt: "desc" }, take: 10 })
  ]);
  const canEdit = ["OWNER", "ADMIN", "MANAGER"].includes(membership.role);
  const members = canEdit ? await prisma.organizationMember.findMany({ where: { organizationId: organization.id, status: "ACTIVE" }, include: { user: true } }) : [];
  const status = { ACTIVE: ["Đang sử dụng", "badge-success"], MAINTENANCE: ["Đang bảo dưỡng", "badge-warning"], PAUSED: ["Tạm ngừng", "badge-neutral"], ARCHIVED: ["Đã lưu trữ", "badge-neutral"] }[vehicle.status];
  return <section className="mx-auto max-w-6xl space-y-6">
    <Link href="/vehicles" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700">← Quay lại danh sách xe</Link>
    <PageHeader eyebrow="HỒ SƠ PHƯƠNG TIỆN" title={vehicle.name} description={`${vehicle.plate} · ${vehicle.brand ?? ""} ${vehicle.model ?? ""}`} action={canCreateExpense(membership.role) && vehicle.status !== "ARCHIVED" ? <Link className="btn w-full sm:w-auto" href={`/expenses/new?vehicleId=${id}`}>+ Thêm chi phí</Link> : undefined}/>
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="vehicle-detail-hero relative flex min-h-60 items-center justify-center overflow-hidden rounded-[24px] border border-[var(--stroke-soft)]">
        {vehicle.imageObjectKey ? <Image unoptimized width={960} height={480} src={`/api/vehicles/${id}/image`} alt={`Ảnh ${vehicle.name}`} className="absolute inset-0 h-full w-full object-cover"/> : <CarFront aria-hidden size={120} strokeWidth={1} className="relative text-[var(--brand-primary)] opacity-40"/>}
        <span className={`badge absolute left-4 top-4 ${status[1]}`}>{status[0]}</span>
      </div>
      <div className="grid grid-cols-2 gap-3"><StatCard label="Tổng chi phí ghi nhận" value={formatVND(total._sum.amount?.toString() ?? "0")} detail="Các giao dịch POSTED"/><StatCard label="Đồng hồ hiện tại" value={`${vehicle.odometer.toLocaleString("vi-VN")} km`} detail="Số km được ghi nhận"/>
        <div className="card col-span-2"><p className="stat-label">Người phụ trách</p><p className="mt-2 font-semibold">{vehicle.assignedTo?.name ?? vehicle.assignedTo?.email ?? "Chưa phân công"}</p><p className="muted mt-2">{vehicle.year ?? "Chưa rõ năm"} · {vehicle.fuelType} · {vehicle.color ?? "Chưa ghi màu xe"}</p></div>
      </div>
    </div>
    <section className="card"><h2 className="section-title">Đi nhanh đến nghiệp vụ</h2><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Link className="btn-secondary justify-start" href={`/expenses?vehicleId=${id}`}><ReceiptText size={18}/>Sổ chi phí</Link><Link className="btn-secondary justify-start" href={`/fuel?vehicleId=${id}`}><Fuel size={18}/>Nhiên liệu</Link><Link className="btn-secondary justify-start" href={`/trips?vehicleId=${id}`}><Route size={18}/>Hành trình</Link><Link className="btn-secondary justify-start" href={`/maintenance?vehicleId=${id}`}><CalendarClock size={18}/>Bảo dưỡng</Link>
      {canCreateExpense(membership.role) && <><Link className="btn-secondary justify-start" href={`/fuel/new?vehicleId=${id}`}><Fuel size={18}/>Ghi nhiên liệu</Link><Link className="btn-secondary justify-start" href={`/trips/new?vehicleId=${id}`}><Gauge size={18}/>Ghi hành trình</Link></>}
    </div></section>
    <section className="card"><div className="flex items-center justify-between gap-3"><h2 className="section-title">Giao dịch gần đây</h2><Link className="text-sm font-semibold text-blue-700" href={`/expenses?vehicleId=${id}`}>Xem tất cả →</Link></div>
      {recent.length ? <ul className="divider-list mt-3">{recent.map(item => <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3"><div className="min-w-0"><Link href={`/expenses/${item.id}`} className="font-semibold text-[var(--brand-deep)] hover:underline">{item.category.name}</Link><p className="muted">{item.occurredAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} {item.status === "VOID" ? "· Đã hủy" : ""}</p></div><strong className="money">{formatVND(item.amount.toString())}</strong></li>)}</ul> : <p className="muted mt-4">Chưa có giao dịch cho phương tiện này.</p>}
    </section>
    {canEdit && <section className="space-y-4"><OdometerCorrectionForm vehicleId={id} current={vehicle.odometer}/><details className="card group"><summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold"><Pencil size={18}/>Chỉnh sửa hồ sơ xe</summary><div className="mt-5"><VehicleForm vehicle={vehicle} assignees={members.map(m => ({ id: m.userId, name: m.user.name ?? m.user.email ?? m.userId }))}/></div></details><details className="card"><summary className="min-h-11 cursor-pointer font-semibold text-red-700">Lưu trữ phương tiện</summary><p className="muted my-3">Xe lưu trữ vẫn giữ nguyên giao dịch và lịch sử. Bạn có thể xem nhưng không tiếp tục ghi chi phí.</p><form action={archiveVehicle.bind(null, id)}><button className="btn-secondary" type="submit">Xác nhận lưu trữ xe</button></form></details></section>}
  </section>;
}
