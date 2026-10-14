"use client";

import { useFormStatus } from "react-dom";
import { VndAmountInput } from "./vnd-amount-input";
import { OfflineNotice, useOnlineSubmission } from "./online-submission";

function SaveEdit() {
  const { pending } = useFormStatus();
  return <div className="form-submit-sticky"><button className="btn w-full sm:w-auto" type="submit" disabled={pending}>{pending ? "Đang lưu thay đổi..." : "Lưu thay đổi"}</button></div>;
}

export function ExpenseEditForm({ action, amount, description }: {
  action: (formData: FormData) => Promise<void>;
  amount: string;
  description: string;
}) {
  const { offlineError, onSubmit } = useOnlineSubmission();
  return <form action={action} onSubmit={onSubmit} className="card space-y-4">
    <h2 className="section-title">Điều chỉnh giao dịch</h2>
    <div className="rounded-2xl border border-blue-100 bg-[#f0f5ff] p-4">
      <label className="block"><span className="label text-[#153c88]">Số tiền (VND) *</span><VndAmountInput initialDigits={amount} /></label>
      <p className="mt-2 text-xs text-blue-700">Số tiền được hiển thị theo nhóm hàng nghìn và lưu bằng VND nguyên.</p>
    </div>
    <label className="block"><span className="label">Ghi chú</span><textarea name="description" rows={3} defaultValue={description}/></label>
    {offlineError && <OfflineNotice />}
    <SaveEdit />
  </form>;
}
