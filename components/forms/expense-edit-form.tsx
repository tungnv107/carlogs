"use client";

import { useFormStatus } from "react-dom";
import { VndAmountInput } from "./vnd-amount-input";
import { OfflineNotice, useOnlineSubmission } from "./online-submission";

function SaveEdit() {
  const { pending } = useFormStatus();
  return <div className="form-submit-sticky"><button className="btn w-full sm:w-auto" type="submit" disabled={pending}>{pending ? "Đang lưu thay đổi..." : "Lưu thay đổi"}</button></div>;
}

type Option = { id: string; label: string };

export function ExpenseEditForm({ action, amount, description, vehicles, categories, vehicleId, categoryId, date, odometer, vendor, paymentMethod }: {
  action: (formData: FormData) => Promise<void>;
  amount: string;
  description: string;
  vehicles: Option[];
  categories: Option[];
  vehicleId: string;
  categoryId: string;
  date: string;
  odometer: number | null;
  vendor: string;
  paymentMethod: string;
}) {
  const { offlineError, onSubmit } = useOnlineSubmission();
  return <form action={action} onSubmit={onSubmit} className="card space-y-4">
    <h2 className="section-title">Điều chỉnh giao dịch</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block"><span className="label">Phương tiện *</span><select name="vehicleId" required defaultValue={vehicleId}>{vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
      <label className="block"><span className="label">Danh mục *</span><select name="categoryId" required defaultValue={categoryId}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
    </div>
    <label className="block"><span className="label">Ngày phát sinh *</span><input name="date" type="date" defaultValue={date} required /></label>
    <div className="rounded-2xl border border-blue-100 bg-[#f0f5ff] p-4">
      <label className="block"><span className="label text-[#153c88]">Số tiền (VND) *</span><VndAmountInput initialDigits={amount} /></label>
      <p className="mt-2 text-xs text-blue-700">Số tiền được hiển thị theo nhóm hàng nghìn và lưu bằng VND nguyên.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block"><span className="label">Đồng hồ km</span><input name="odometer" type="number" min="0" max="1000000000" defaultValue={odometer ?? ""} /></label>
      <label className="block"><span className="label">Hình thức thanh toán</span><select name="paymentMethod" defaultValue={paymentMethod}><option value="">Chưa chọn</option>{["Tiền mặt", "Chuyển khoản", "Thẻ"].map(value => <option key={value} value={value}>{value}</option>)}{paymentMethod && !["Tiền mặt", "Chuyển khoản", "Thẻ"].includes(paymentMethod) && <option value={paymentMethod}>{paymentMethod}</option>}</select></label>
    </div>
    <label className="block"><span className="label">Đơn vị cung cấp</span><input name="vendor" maxLength={150} defaultValue={vendor} /></label>
    <label className="block"><span className="label">Ghi chú</span><textarea name="description" rows={3} defaultValue={description}/></label>
    {offlineError && <OfflineNotice />}
    <SaveEdit />
  </form>;
}
