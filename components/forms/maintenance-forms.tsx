"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createMaintenance, createSchedule, createDocument, updateMaintenance, updateSchedule, updateDocument } from "@/modules/maintenance/actions";
import { VndAmountInput } from "./vnd-amount-input";
import { OfflineNotice, useOnlineSubmission } from "./online-submission";

type VehicleOption = { id: string; label: string };

function Submit({ title }: { title: string }) { const { pending } = useFormStatus(); return <div className="form-submit-sticky"><button className="btn w-full" disabled={pending}>{pending ? "Đang lưu..." : title}</button></div>; }
function VehicleSelect({ vehicles, selectedVehicle, locked = false }: { vehicles: VehicleOption[]; selectedVehicle?: string; locked?: boolean }) { return locked ? <div><span className="label">Phương tiện</span><p className="font-semibold">{vehicles.find(v => v.id === selectedVehicle)?.label}</p><input type="hidden" name="vehicleId" value={selectedVehicle}/></div> : <label className="block"><span className="label">Phương tiện *</span><select name="vehicleId" defaultValue={selectedVehicle ?? vehicles[0]?.id} required>{vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>; }

type MaintenanceEdit = { id: string; vehicleId: string; kind: string; occurredAt: string; odometer: number; description: string; vendor: string | null; amount: string };
type ScheduleEdit = { id: string; vehicleId: string; title: string; dueDate: string; dueOdometer: number | null; warningDays: number; warningKm: number };
type DocumentEdit = { id: string; vehicleId: string; kind: string; documentNumber: string | null; effectiveAt: string; expiresAt: string; originalName: string | null };

export function MaintenanceForm({ vehicles, initialTime, keyId, selectedVehicle, record }: { vehicles: VehicleOption[]; initialTime: string; keyId?: string; selectedVehicle?: string; record?: MaintenanceEdit }) {
  const [state, action] = useActionState(record ? updateMaintenance.bind(null, record.id) : createMaintenance, { error: "" });
  const { offlineError, onSubmit } = useOnlineSubmission();
  return <form action={action} onSubmit={onSubmit} className="card space-y-4">
    <header className="border-b border-[#e4eaf2] pb-4"><p className="eyebrow">NHẬT KÝ KỸ THUẬT</p><h2 className="section-title mt-1">{record ? "Sửa hồ sơ bảo dưỡng / sửa chữa" : "Ghi nhận bảo dưỡng / sửa chữa"}</h2><p className="muted mt-1">Lưu công việc đã thực hiện và chi phí phát sinh theo xe.</p></header>{!record && <input type="hidden" name="idempotencyKey" value={keyId}/>}
    <VehicleSelect vehicles={vehicles} selectedVehicle={record?.vehicleId ?? selectedVehicle} locked={!!record}/>
    <label className="block"><span className="label">Loại</span><select name="kind" defaultValue={record?.kind ?? "MAINTENANCE"}><option value="MAINTENANCE">Bảo dưỡng</option><option value="REPAIR">Sửa chữa</option></select></label>
    <div className="grid gap-3 sm:grid-cols-2"><label><span className="label">Ngày thực hiện</span><input name="occurredAt" type="datetime-local" defaultValue={record?.occurredAt ?? initialTime} required/></label><label><span className="label">Km thực hiện</span><input name="odometer" type="number" inputMode="numeric" min="0" defaultValue={record?.odometer} required/></label></div>
    <label className="block"><span className="label">Công việc *</span><textarea name="description" minLength={3} maxLength={2000} defaultValue={record?.description} required/></label>
    <label className="block"><span className="label">Gara / đơn vị</span><input name="vendor" maxLength={150} defaultValue={record?.vendor ?? ""}/></label>
    <div className="rounded-2xl border border-blue-100 bg-[#eff5ff] p-4"><label className="block"><span className="label text-[#153c88]">Chi phí (VND) *</span><VndAmountInput initialDigits={record?.amount ?? "0"} /></label><p className="mt-2 text-xs leading-relaxed text-blue-700">Nhập 0 nếu miễn phí. Chi phí lớn hơn 0 được ghi vào sổ một lần trong cùng giao dịch.</p></div>
    {offlineError && <OfflineNotice />}{state.error && <p role="alert" className="error">{state.error}</p>}<Submit title={record ? "Cập nhật công việc" : "Lưu công việc"}/>
  </form>;
}

export function ScheduleForm({ vehicles, selectedVehicle, record }: { vehicles: VehicleOption[]; selectedVehicle?: string; record?: ScheduleEdit }) {
  const [state, action] = useActionState(record ? updateSchedule.bind(null, record.id) : createSchedule, { error: "" });
  const { offlineError, onSubmit } = useOnlineSubmission();
  return <form action={action} onSubmit={onSubmit} className="card space-y-4"><header className="border-b border-[#e4eaf2] pb-4"><p className="eyebrow">NHẮC VIỆC ĐÚNG HẠN</p><h2 className="section-title mt-1">{record ? "Chỉnh sửa lịch nhắc bảo dưỡng" : "Lên lịch nhắc bảo dưỡng"}</h2><p className="muted mt-1">Đặt hạn theo ngày, đồng hồ km hoặc cả hai.</p></header>
    <VehicleSelect vehicles={vehicles} selectedVehicle={record?.vehicleId ?? selectedVehicle} locked={!!record}/>
    <label className="block"><span className="label">Hạng mục *</span><input name="title" minLength={3} maxLength={150} placeholder="Thay dầu động cơ" defaultValue={record?.title} required/></label>
    <div className="grid gap-3 sm:grid-cols-2"><label><span className="label">Hạn ngày</span><input name="dueDate" type="date" defaultValue={record?.dueDate}/></label><label><span className="label">Hạn km</span><input name="dueOdometer" type="number" min="0" inputMode="numeric" defaultValue={record?.dueOdometer ?? ""}/></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label><span className="label">Báo trước (ngày)</span><input name="warningDays" type="number" min="0" defaultValue={record?.warningDays ?? 30} required/></label><label><span className="label">Báo trước (km)</span><input name="warningKm" type="number" min="0" defaultValue={record?.warningKm ?? 1000} required/></label></div>
    {offlineError && <OfflineNotice />}{state.error && <p role="alert" className="error">{state.error}</p>}<Submit title={record ? "Cập nhật lịch nhắc" : "Tạo lịch nhắc"}/>
  </form>;
}

export function DocumentForm({ vehicles, selectedVehicle, record }: { vehicles: VehicleOption[]; selectedVehicle?: string; record?: DocumentEdit }) {
  const [state, action] = useActionState(record ? updateDocument.bind(null, record.id) : createDocument, { error: "" });
  const { offlineError, onSubmit } = useOnlineSubmission();
  return <form action={action} onSubmit={onSubmit} className="card space-y-4"><header className="border-b border-[#e4eaf2] pb-4"><p className="eyebrow">HỒ SƠ PHƯƠNG TIỆN</p><h2 className="section-title mt-1">{record ? "Chỉnh sửa giấy tờ xe" : "Thêm giấy tờ xe"}</h2><p className="muted mt-1">Theo dõi thời hạn và lưu tệp giấy tờ riêng cho từng phương tiện.</p></header>
    <VehicleSelect vehicles={vehicles} selectedVehicle={record?.vehicleId ?? selectedVehicle} locked={!!record}/>
    <label className="block"><span className="label">Loại giấy tờ *</span><input name="kind" placeholder="Bảo hiểm / đăng kiểm / đăng ký" minLength={2} maxLength={100} defaultValue={record?.kind} required/></label>
    <label className="block"><span className="label">Số giấy tờ</span><input name="documentNumber" maxLength={100} defaultValue={record?.documentNumber ?? ""}/></label>
    <div className="grid gap-3 sm:grid-cols-2"><label><span className="label">Hiệu lực từ</span><input name="effectiveAt" type="date" defaultValue={record?.effectiveAt}/></label><label><span className="label">Hết hạn</span><input name="expiresAt" type="date" defaultValue={record?.expiresAt}/></label></div>
    <label className="block"><span className="label">Tệp đính kèm (PDF, JPEG, PNG, WebP; ≤ 5MB)</span><input name="document" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/>{record?.originalName && <span className="muted">Hiện tại: {record.originalName}. Bỏ trống để giữ tệp.</span>}</label>
    {record?.originalName && <label className="flex items-center gap-2 text-sm"><input className="!w-auto" name="removeCurrentFile" type="checkbox"/><span>Xóa tệp hiện tại (khi không chọn tệp thay thế)</span></label>}
    {offlineError && <OfflineNotice />}{state.error && <p role="alert" className="error">{state.error}</p>}<Submit title={record ? "Cập nhật giấy tờ" : "Lưu giấy tờ"}/>
  </form>;
}
