import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { boundedReportPage } from "@/lib/report-period";
import { completeSchedule } from "@/modules/maintenance/actions";

export default async function CompleteMaintenanceSchedule({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { organization } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const { id } = await params;
  const { page: requestedPage } = await searchParams;
  const schedule = await prisma.maintenanceSchedule.findFirst({
    where: { id, organizationId: organization.id, active: true },
    include: { vehicle: { select: { plate: true, name: true } } }
  });
  if (!schedule) notFound();
  const where = { organizationId: organization.id, vehicleId: schedule.vehicleId, occurredAt: { gte: schedule.createdAt } };
  const count = await prisma.maintenanceRecord.count({ where });
  const page = boundedReportPage(requestedPage, count, 15);
  const work = await prisma.maintenanceRecord.findMany({ where, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], skip: (page - 1) * 15, take: 15 });
  return <section className="mx-auto max-w-3xl space-y-5">
    <Link href="/maintenance" className="text-sm text-blue-700">← Trở về danh sách bảo dưỡng</Link>
    <div><h1 className="text-2xl font-bold text-navy">Hoàn thành lịch: {schedule.title}</h1><p className="muted">{schedule.vehicle.plate} · {schedule.vehicle.name}</p></div>
    <p className="card text-sm">Chọn đúng lần bảo dưỡng/sửa chữa đã ghi nhận cho lịch này. Hệ thống lưu mã công việc liên quan vào nhật ký kiểm toán. Nếu chưa có công việc, hãy tạo bản ghi bảo dưỡng trước.</p>
    {work.length ? <form action={completeSchedule.bind(null, id)} className="card space-y-4">
      <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Công việc đã thực hiện ({count})</legend>
        {work.map((entry, index) => <label key={entry.id} className="flex cursor-pointer gap-3 rounded-xl border p-3">
          <input className="mt-1 h-5 w-5 shrink-0" type="radio" name="maintenanceRecordId" value={entry.id} required defaultChecked={index === 0} />
          <span><strong>{entry.kind === "REPAIR" ? "Sửa chữa" : "Bảo dưỡng"}</strong> · {entry.occurredAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}<br />{entry.description}<br /><span className="muted">{entry.odometer.toLocaleString("vi-VN")} km · {entry.vendor || "Không ghi gara"}</span></span>
        </label>)}
      </fieldset>
      <div className="flex items-center justify-between gap-3"><div>{page > 1 && <Link className="text-blue-700" href={`?page=${page - 1}`}>← Trước</Link>}{count > page * 15 && <Link className="ml-4 text-blue-700" href={`?page=${page + 1}`}>Tiếp →</Link>}</div><button className="btn" type="submit">Xác nhận hoàn thành lịch</button></div>
    </form> : <div className="card space-y-3"><p>Chưa có công việc bảo dưỡng/sửa chữa sau khi lập lịch.</p><Link href="/maintenance" className="text-blue-700">Ghi nhận công việc →</Link></div>}
  </section>;
}
