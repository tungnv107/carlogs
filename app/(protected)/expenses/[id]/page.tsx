import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/finance";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { updateExpense, voidExpense, addExpenseReceipt, deleteExpenseReceipt } from "@/modules/expenses/actions";
import { canModifyExpense, expenseScope, vehicleScope } from "@/lib/access-scope";
import { ConfirmSubmit } from "@/components/forms/confirm-submit";
import { ExpenseEditForm } from "@/components/forms/expense-edit-form";
import { PageHeader } from "@/components/ui/page-header";
import { FileText, ReceiptText } from "lucide-react";

export default async function ExpenseDetails({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ files?: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const { id } = await params;
  const query = await searchParams;
  const expense = await prisma.expense.findFirst({ where: { id, organizationId: organization.id, ...expenseScope(membership.role, user.id) }, include: { vehicle: true, category: true, attachments: true, fuelLog: { select: { id: true } }, maintenanceRecord: { select: { id: true } } } });
  if (!expense) notFound();
  const canEdit = canModifyExpense(membership.role, user.id, expense.createdById, expense.vehicle.assignedToId) && expense.status === "POSTED";
  const canEditIndependent = canEdit && !expense.fuelLog && !expense.maintenanceRecord;
  const [vehicleChoices, categoryChoices] = canEditIndependent ? await Promise.all([
    prisma.vehicle.findMany({ where: { organizationId: organization.id, ...vehicleScope(membership.role, user.id), OR: [{ status: { not: "ARCHIVED" } }, { id: expense.vehicleId }] }, select: { id: true, plate: true, name: true, status: true }, orderBy: { plate: "asc" } }),
    prisma.expenseCategory.findMany({ where: { organizationId: organization.id, OR: [{ active: true }, { id: expense.categoryId }] }, select: { id: true, name: true, active: true }, orderBy: { name: "asc" } })
  ]) : [[], []];
  return <section className="mx-auto max-w-2xl space-y-5"><Link href="/expenses" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700">← Lịch sử chi phí</Link><PageHeader eyebrow="SỔ CHI PHÍ" title="Chi tiết giao dịch" description="Thông tin đã ghi vào sổ và các chứng từ liên quan."/>
    <div className="card relative overflow-hidden"><div className="flex items-start justify-between gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf1fc] text-[#153c88]"><ReceiptText size={25}/></div><span className={`badge ${expense.status === "VOID" ? "badge-danger" : "badge-success"}`}>{expense.status === "VOID" ? "Đã hủy" : "Đã ghi nhận"}</span></div><p className="stat-label mt-5">{expense.category.name} · <Link href={`/vehicles/${expense.vehicleId}`} className="font-semibold text-blue-700">{expense.vehicle.plate}</Link></p><p className="stat-number money mt-2 text-[#153c88]">{formatVND(expense.amount.toString())}</p><p className="muted mt-3">{new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "long" }).format(expense.occurredAt)}</p><div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#edf1f7] pt-4"><div><p className="stat-label">Đơn vị cung cấp</p><p className="mt-1 break-words text-sm font-semibold">{expense.vendor || "Chưa ghi"}</p></div><div><p className="stat-label">Đồng hồ km</p><p className="mt-1 text-sm font-semibold">{expense.odometer?.toLocaleString("vi-VN") ?? "—"} km</p></div></div>{expense.description && <p className="mt-4 break-words text-sm">{expense.description}</p>}</div>
    {(expense.attachments.length > 0 || canEdit) && <div className="card space-y-3"><h2 className="section-title">Chứng từ ({expense.attachments.length})</h2>{query.files && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-800">Đã cập nhật chứng từ.</p>}{expense.attachments.map(file => <div key={file.id} className="flex flex-wrap items-center justify-between gap-2"><a className="flex min-h-11 min-w-0 items-center gap-2 break-all font-semibold text-blue-700 hover:underline" href={`/api/attachments/${file.id}`}><FileText size={18} className="shrink-0"/>{file.originalName}</a>{canEdit && <form action={deleteExpenseReceipt.bind(null, id, file.id)}><ConfirmSubmit prompt={`Xóa chứng từ ${file.originalName}?`}>Xóa</ConfirmSubmit></form>}</div>)}{canEdit && <form action={addExpenseReceipt.bind(null, id)} className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-end" encType="multipart/form-data"><label className="min-w-0 flex-1"><span className="label">Thêm chứng từ (JPEG, PNG, WebP, PDF tối đa 5 MB)</span><input name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required /></label><button className="btn-secondary" type="submit">Tải chứng từ lên</button></form>}</div>}
    {expense.fuelLog && <p className="card text-sm">Giao dịch này được tạo từ lần ghi nhiên liệu. Để cập nhật số lượng, đơn giá hoặc số tiền, hãy <Link href="/fuel" className="font-semibold text-blue-700 underline">sửa lần ghi nhiên liệu</Link>.</p>}
    {expense.maintenanceRecord && <p className="card text-sm">Giao dịch liên kết hồ sơ bảo dưỡng/sửa chữa. Hãy <Link href="/maintenance" className="font-semibold text-blue-700 underline">sửa hồ sơ bảo dưỡng</Link> để cập nhật số tiền.</p>}
    {canEditIndependent && <ExpenseEditForm key={id} action={updateExpense.bind(null, id)} amount={expense.amount.toString()} description={expense.description ?? ""} vehicleId={expense.vehicleId} categoryId={expense.categoryId} date={new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(expense.occurredAt)} odometer={expense.odometer} vendor={expense.vendor ?? ""} paymentMethod={expense.paymentMethod ?? ""} vehicles={vehicleChoices.map(v => ({ id: v.id, label: `${v.plate} · ${v.name}${v.status === "ARCHIVED" ? " (đã lưu trữ)" : ""}` }))} categories={categoryChoices.map(c => ({ id: c.id, label: `${c.name}${c.active ? "" : " (đã ngừng)"}` }))} />}
    {canEditIndependent && <form action={voidExpense.bind(null, id)} className="card"><p className="muted mb-3">Hủy sẽ giữ lịch sử kiểm toán và loại giao dịch khỏi tổng chi phí.</p><ConfirmSubmit prompt="Bạn chắc chắn muốn hủy giao dịch này?">Hủy giao dịch</ConfirmSubmit></form>}
  </section>;
}
