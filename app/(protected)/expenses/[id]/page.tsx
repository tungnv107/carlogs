import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/finance";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { updateExpense, voidExpense } from "@/modules/expenses/actions";
import { canModifyExpense, expenseScope } from "@/lib/access-scope";
import { ConfirmSubmit } from "@/components/forms/confirm-submit";
import { ExpenseEditForm } from "@/components/forms/expense-edit-form";
import { PageHeader } from "@/components/ui/page-header";
import { FileText, ReceiptText } from "lucide-react";

export default async function ExpenseDetails({ params }: { params: Promise<{ id: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const { id } = await params;
  const expense = await prisma.expense.findFirst({ where: { id, organizationId: organization.id, ...expenseScope(membership.role, user.id) }, include: { vehicle: true, category: true, attachments: true, fuelLog: { select: { id: true } }, maintenanceRecord: { select: { id: true } } } });
  if (!expense) notFound();
  const canEdit = canModifyExpense(membership.role, user.id, expense.createdById, expense.vehicle.assignedToId) && expense.status === "POSTED";
  return <section className="mx-auto max-w-2xl space-y-5"><Link href="/expenses" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700">← Lịch sử chi phí</Link><PageHeader eyebrow="SỔ CHI PHÍ" title="Chi tiết giao dịch" description="Thông tin đã ghi vào sổ và các chứng từ liên quan."/>
    <div className="card relative overflow-hidden"><div className="flex items-start justify-between gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf1fc] text-[#153c88]"><ReceiptText size={25}/></div><span className={`badge ${expense.status === "VOID" ? "badge-danger" : "badge-success"}`}>{expense.status === "VOID" ? "Đã hủy" : "Đã ghi nhận"}</span></div><p className="stat-label mt-5">{expense.category.name} · <Link href={`/vehicles/${expense.vehicleId}`} className="font-semibold text-blue-700">{expense.vehicle.plate}</Link></p><p className="stat-number money mt-2 text-[#153c88]">{formatVND(expense.amount.toString())}</p><p className="muted mt-3">{new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "long" }).format(expense.occurredAt)}</p><div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#edf1f7] pt-4"><div><p className="stat-label">Đơn vị cung cấp</p><p className="mt-1 break-words text-sm font-semibold">{expense.vendor || "Chưa ghi"}</p></div><div><p className="stat-label">Đồng hồ km</p><p className="mt-1 text-sm font-semibold">{expense.odometer?.toLocaleString("vi-VN") ?? "—"} km</p></div></div>{expense.description && <p className="mt-4 break-words text-sm">{expense.description}</p>}</div>
    {expense.attachments.length > 0 && <div className="card"><h2 className="section-title">Chứng từ ({expense.attachments.length})</h2>{expense.attachments.map((file) => <a key={file.id} className="mt-3 flex min-h-11 items-center gap-2 break-all rounded-xl bg-[#f8fbff] p-3 font-semibold text-blue-700 hover:underline" href={`/api/attachments/${file.id}`}><FileText size={18} className="shrink-0"/>{file.originalName}</a>)}</div>}
    {expense.fuelLog && <p className="card text-sm">Giao dịch này được tạo từ lần ghi nhiên liệu. Số tiền luôn bằng số lượng × đơn giá, và được hạch toán đúng một lần.</p>}
    {expense.maintenanceRecord && <p className="card text-sm">Giao dịch liên kết hồ sơ bảo dưỡng/sửa chữa. Không thể chỉnh sửa số tiền riêng lẻ.</p>}
    {canEdit && !expense.fuelLog && !expense.maintenanceRecord && <ExpenseEditForm key={id} action={updateExpense.bind(null, id)} amount={expense.amount.toString()} description={expense.description ?? ""} />}
    {canEdit && <form action={voidExpense.bind(null, id)} className="card"><p className="muted mb-3">Hủy sẽ giữ lịch sử kiểm toán và loại giao dịch khỏi tổng chi phí.</p><ConfirmSubmit prompt="Bạn chắc chắn muốn hủy giao dịch này?">Hủy giao dịch</ConfirmSubmit></form>}
  </section>;
}
