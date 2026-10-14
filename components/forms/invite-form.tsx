"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createInvitation } from "@/modules/organizations/invitations";
import { OfflineNotice, useOnlineSubmission } from "./online-submission";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Đang tạo..." : "Tạo lời mời"}</button>;
}

export function InviteForm() {
  const [state, action] = useActionState(createInvitation, { error: "", link: "" });
  const { offlineError, onSubmit } = useOnlineSubmission();
  return <form action={action} onSubmit={onSubmit} className="card space-y-4">
    <div className="border-b border-[var(--stroke-soft)] pb-4"><p className="eyebrow">MỜI NGƯỜI CỘNG TÁC</p><h2 className="section-title mt-1">Tạo lời mời</h2><p className="muted mt-1">Chọn vai trò phù hợp với trách nhiệm của người được mời.</p></div>
    <label className="block"><span className="label">Email Google của người được mời</span><input name="email" type="email" required maxLength={254} placeholder="nguoidung@gmail.com" /></label>
    <label className="block"><span className="label">Vai trò</span><select name="role" defaultValue="VIEWER">
      <option value="VIEWER">Xem</option><option value="DRIVER">Lái xe</option>
      <option value="ACCOUNTANT">Kế toán</option><option value="MANAGER">Quản lý</option><option value="ADMIN">Quản trị</option>
    </select></label>
    <div className="flex justify-end"><Submit /></div>
    {offlineError && <OfflineNotice />}
    {state.error && <p role="alert" className="error">{state.error}</p>}
    {state.link && <div role="status" className="surface-subtle rounded-xl p-4 break-all">
      <p className="font-semibold">Sao chép đường dẫn dưới đây và gửi riêng cho người được mời (hiệu lực 7 ngày):</p>
      <a className="mt-2 block text-[var(--brand-deep)] underline underline-offset-4" href={state.link}>{state.link}</a>
      <button type="button" className="btn-secondary mt-3" onClick={() => navigator.clipboard.writeText(new URL(state.link, window.location.origin).href)}>Sao chép liên kết đầy đủ</button>
    </div>}
  </form>;
}
