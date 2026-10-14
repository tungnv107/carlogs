"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createExpense } from "@/modules/expenses/actions";
import { VndAmountInput } from "./vnd-amount-input";
import { ReceiptInput } from "./receipt-input";
import { VehiclePicker } from "./vehicle-picker";
import { OfflineNotice, useOnlineSubmission } from "./online-submission";
import { ChevronDown, ShieldCheck, Wallet } from "lucide-react";

type Option = { id: string; label: string };

function Save() {
  const { pending } = useFormStatus();
  return <div className="form-submit-sticky grid gap-2 sm:grid-cols-2"><button name="submitMode" value="done" type="submit" disabled={pending} className="btn w-full">{pending ? "Đang lưu chi phí..." : "Lưu chi phí"}</button><button name="submitMode" value="next" type="submit" disabled={pending} className="btn-secondary w-full">Lưu & thêm tiếp</button></div>;
}

export function ExpenseForm({ vehicles, categories, date, keyId, selectedVehicle }: {
  vehicles: Option[]; categories: Option[]; date: string; keyId: string; selectedVehicle?: string;
}) {
  const [state, action] = useActionState(createExpense, { error: "" });
  const { offlineError, onSubmit } = useOnlineSubmission();
  return <form action={action} onSubmit={onSubmit} onReset={(event) => event.preventDefault()} className="expense-entry space-y-4">
    <input type="hidden" name="idempotencyKey" value={keyId} />
    <section className="card space-y-5">
      <div className="border-b border-[var(--stroke-soft)] pb-5"><p className="eyebrow">01 / GHI NHẬN</p><h2 className="section-title mt-2">Thông tin khoản chi</h2><p className="muted mt-1">Chọn phương tiện, danh mục và số tiền.</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><span className="label">Phương tiện *</span><VehiclePicker vehicles={vehicles} selectedVehicle={selectedVehicle}/></div>
      <label className="block"><span className="label">Danh mục chi phí *</span><select name="categoryId" required defaultValue=""><option value="" disabled>Chọn danh mục chi phí</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label></div>
      <div className="amount-well"><label className="block"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--brand-deep)]"><Wallet size={17}/>Số tiền (VND) *</span><div className="mt-3"><VndAmountInput /></div><span className="muted mt-2 block text-xs">Ví dụ: 150000 tương ứng 150.000 đ</span></label></div>
      <label className="block"><span className="label">Ngày phát sinh *</span><input name="date" type="date" defaultValue={date} required /></label>
    </section>
    <details className="card group"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-semibold text-[var(--ink)]"><span><span className="eyebrow block pb-1">02 / TÙY CHỌN</span>Thông tin bổ sung</span><ChevronDown size={18} className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180"/></summary><p className="muted mt-2">Bạn có thể bổ sung số km, hình thức thanh toán và hóa đơn.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="label">Đồng hồ km (nếu có)</span><input name="odometer" type="number" min="0" inputMode="numeric" placeholder="Không bắt buộc" /></label><label><span className="label">Hình thức thanh toán</span><select name="paymentMethod" defaultValue=""><option value="">Chưa chọn</option><option>Tiền mặt</option><option>Chuyển khoản</option><option>Thẻ</option></select></label></div>
      <div className="mt-4 space-y-4"><label className="block"><span className="label">Đơn vị cung cấp</span><input name="vendor" placeholder="Tên cửa hàng/garage"/></label><label className="block"><span className="label">Nội dung/ghi chú</span><textarea name="description" rows={3} placeholder="Mô tả khoản chi"/></label><ReceiptInput /></div>
    </details>
    {offlineError && <OfflineNotice />}
    {state.error && <p className="error" role="alert">{state.error}</p>}
    <Save />
    <p className="muted flex items-center justify-center gap-2 text-center"><ShieldCheck size={15}/>Mỗi thao tác chỉ ghi nhận một giao dịch.</p>
  </form>;
}
