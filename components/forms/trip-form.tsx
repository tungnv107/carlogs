"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTrip, updateTrip, correctOdometer } from "@/modules/trips/actions";
import { OfflineNotice, useOnlineSubmission } from "./online-submission";

function Save({ label }: { label: string }) { const { pending } = useFormStatus(); return <button className="btn w-full" disabled={pending}>{pending ? "Đang lưu..." : label}</button>; }

type TripEdit = { id: string; vehicleId: string; driverId: string | null; startedAt: string; endedAt: string; odometerStart: number; odometerEnd: number; purpose: string | null; notes: string | null };
export function TripForm({ vehicles, drivers, initialTime, selectedVehicle, record }: { vehicles: { id: string; label: string }[]; drivers: { id: string; label: string }[]; initialTime: string; selectedVehicle?: string; record?: TripEdit }) {
  const [state, action] = useActionState(record ? updateTrip.bind(null, record.id) : createTrip, { error: "" });
  const { offlineError, onSubmit } = useOnlineSubmission();
  const endTime = new Date(new Date(`${initialTime}:00+07:00`).getTime() + 3_600_000);
  const endLocal = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(endTime).replace(" ", "T");
  return <form action={action} onSubmit={onSubmit} className="card space-y-4">
    <header className="border-b border-[#e4eaf2] pb-4"><p className="eyebrow">NHẬT KÝ HÀNH TRÌNH</p><h2 className="section-title mt-1">{record ? "Chỉnh sửa chuyến đi" : "Thông tin chuyến đi"}</h2><p className="muted mt-1">Km đầu và cuối giúp tính quãng đường thực tế cho báo cáo.</p></header>
    <label className="block"><span className="label">Xe *</span>{record ? <><p className="font-semibold">{vehicles.find(v => v.id === record.vehicleId)?.label}</p><input name="vehicleId" type="hidden" value={record.vehicleId}/></> : <select name="vehicleId" required defaultValue={selectedVehicle ?? vehicles[0]?.id}>{vehicles.map(v => <option value={v.id} key={v.id}>{v.label}</option>)}</select>}</label>
    <label className="block"><span className="label">Người lái</span><select name="driverId" defaultValue={record?.driverId ?? ""}><option value="">Tôi</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></label>
    <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Bắt đầu *</span><input name="startedAt" type="datetime-local" defaultValue={record?.startedAt ?? initialTime} required/></label><label><span className="label">Kết thúc *</span><input name="endedAt" type="datetime-local" defaultValue={record?.endedAt ?? endLocal} required/></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Km đầu *</span><input name="odometerStart" type="number" min="0" inputMode="numeric" defaultValue={record?.odometerStart} required/></label><label><span className="label">Km cuối *</span><input name="odometerEnd" type="number" min="0" inputMode="numeric" defaultValue={record?.odometerEnd} required/></label></div>
    <label className="block"><span className="label">Mục đích sử dụng</span><input name="purpose" maxLength={300} defaultValue={record?.purpose ?? ""}/></label>
    <label className="block"><span className="label">Ghi chú</span><textarea name="notes" rows={2} maxLength={2000} defaultValue={record?.notes ?? ""}/></label>
    {offlineError && <OfflineNotice />}
    {state.error && <p className="error" role="alert">{state.error}</p>}
    <div className="form-submit-sticky"><Save label={record ? "Cập nhật hành trình" : "Lưu hành trình"}/></div>
  </form>;
}

export function OdometerCorrectionForm({ vehicleId, current }: { vehicleId: string; current: number }) {
  const [state, action] = useActionState(correctOdometer, { error: "" });
  const { offlineError, onSubmit } = useOnlineSubmission();
  return <form action={action} onSubmit={onSubmit} className="card space-y-3">
    <h3 className="font-bold">Hiệu chỉnh đồng hồ km</h3><p className="muted">Hiện tại: {current.toLocaleString("vi-VN")} km. Mọi thay đổi đều có lịch sử và lý do.</p>
    <input type="hidden" name="vehicleId" value={vehicleId}/>
    <label className="block"><span className="label">Km sau điều chỉnh *</span><input type="number" name="adjustedValue" min="0" max="1000000000" required /></label>
    <label className="block"><span className="label">Lý do *</span><textarea name="reason" minLength={10} maxLength={1000} required /></label>
    {offlineError && <OfflineNotice />}
    {state.error && <p className="error" role="alert">{state.error}</p>}
    <div className="form-submit-sticky"><Save label="Ghi nhận điều chỉnh" /></div>
  </form>;
}
