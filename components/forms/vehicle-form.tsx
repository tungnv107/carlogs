"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createVehicle, updateVehicle } from "@/modules/vehicles/actions";
import type { Vehicle } from "@prisma/client";
import { OfflineNotice, useOnlineSubmission } from "./online-submission";

const types = { CAR: "Ô tô", MOTORBIKE: "Xe máy", TRUCK: "Xe tải", OTHER: "Khác" };
const fuels = { PETROL: "Xăng", DIESEL: "Dầu diesel", ELECTRIC: "Điện", HYBRID: "Hybrid", OTHER: "Khác" };

function Save() {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn w-full sm:w-auto" disabled={pending}>{pending ? "Đang lưu..." : "Lưu phương tiện"}</button>;
}

export function VehicleForm({ vehicle, assignees = [] }: { vehicle?: Vehicle; assignees?: { id: string; name: string }[] }) {
  const action = vehicle ? updateVehicle.bind(null, vehicle.id) : createVehicle;
  const [state, formAction] = useActionState(action, { error: "" });
  const { offlineError, onSubmit } = useOnlineSubmission();
  return <form action={formAction} onSubmit={onSubmit} onReset={(event) => event.preventDefault()} className="card grid gap-5 sm:grid-cols-2">
    <header className="border-b border-[#e4eaf2] pb-4 sm:col-span-2"><p className="eyebrow">HỒ SƠ PHƯƠNG TIỆN</p><h2 className="section-title mt-1">Thông tin nhận diện và sử dụng</h2><p className="muted mt-1">Các trường có dấu * là bắt buộc; thông tin này sẽ dùng khi ghi chi phí, nhiên liệu và bảo dưỡng.</p></header>
    <label><span className="label">Biển số *</span><input name="plate" required defaultValue={vehicle?.plate} placeholder="30A12345" autoCapitalize="characters" /></label>
    <label><span className="label">Tên xe *</span><input name="name" required defaultValue={vehicle?.name} placeholder="Xe gia đình" /></label>
    <label><span className="label">Loại xe</span><select name="type" defaultValue={vehicle?.type ?? "CAR"}>{Object.entries(types).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <label><span className="label">Nhiên liệu</span><select name="fuelType" defaultValue={vehicle?.fuelType ?? "PETROL"}>{Object.entries(fuels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <label><span className="label">Hãng</span><input name="brand" defaultValue={vehicle?.brand ?? ""} placeholder="Toyota" /></label>
    <label><span className="label">Dòng xe</span><input name="model" defaultValue={vehicle?.model ?? ""} placeholder="Vios" /></label>
    <label><span className="label">Màu sắc</span><input name="color" defaultValue={vehicle?.color ?? ""} placeholder="Trắng" /></label>
    <label><span className="label">Năm sản xuất</span><input name="year" type="number" min="1900" max="2100" defaultValue={vehicle?.year ?? ""} /></label>
    <label><span className="label">Người phụ trách</span><select name="assignedToId" defaultValue={vehicle?.assignedToId ?? ""}><option value="">Chưa phân công</option>{assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
    <label><span className="label">Trạng thái</span><select name="status" defaultValue={vehicle?.status ?? "ACTIVE"}><option value="ACTIVE">Đang sử dụng</option><option value="MAINTENANCE">Bảo dưỡng</option><option value="PAUSED">Tạm ngừng</option><option value="ARCHIVED">Ngừng sử dụng</option></select></label>
    <label><span className="label">Số km hiện tại</span><input name="odometer" type="number" inputMode="numeric" min="0" required defaultValue={vehicle?.odometer ?? 0}/></label>
    <label className="sm:col-span-2"><span className="label">Ảnh xe (JPEG, PNG, WebP, tối đa 5 MB)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" />{vehicle?.imageObjectKey && <span className="muted">Bỏ trống để giữ ảnh hiện có.</span>}</label>
    <label className="sm:col-span-2"><span className="label">Ghi chú</span><textarea name="notes" rows={3} defaultValue={vehicle?.notes ?? ""}/></label>
    {offlineError && <div className="sm:col-span-2"><OfflineNotice /></div>}
    {state.error && <p className="error sm:col-span-2" role="alert">{state.error}</p>}
    <div className="form-submit-sticky sm:col-span-2"><Save/></div>
  </form>;
}
