"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createFuelLog, updateFuelLog } from "@/modules/fuel/actions";
import { previewFuelAmountVND } from "@/lib/fuel-preview";

type VehicleOption = { id: string; label: string; fuelType: string };

function Save({ editing = false }: { editing?: boolean }) {
  const { pending } = useFormStatus();
  return <button className="btn w-full" disabled={pending}>{pending ? "Đang ghi nhận..." : editing ? "Cập nhật nhiên liệu / sạc điện" : "Lưu nhiên liệu / sạc điện"}</button>;
}

type FuelEdit = { id: string; vehicleId: string; occurredAt: string; odometer: number; unit: "LITER" | "KWH"; quantity: string; unitPrice: string; isFullTank: boolean; vendor: string | null };
export function FuelForm({ vehicles, initialTime, keyId, selectedVehicle, record }: { vehicles: VehicleOption[]; initialTime: string; keyId?: string; selectedVehicle?: string; record?: FuelEdit }) {
  const [state, action] = useActionState(record ? updateFuelLog.bind(null, record.id) : createFuelLog, { error: "" });
  const [offlineError, setOfflineError] = useState(false);
  const [invalidTotal, setInvalidTotal] = useState(false);
  const [vehicleId, setVehicleId] = useState(record?.vehicleId ?? selectedVehicle ?? vehicles[0]?.id);
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const [unit, setUnit] = useState(record?.unit ?? (vehicle?.fuelType === "ELECTRIC" ? "KWH" : "LITER"));
  const [quantity, setQuantity] = useState(record?.quantity ?? "");
  const [unitPrice, setUnitPrice] = useState(record?.unitPrice ?? "");
  const predicted = previewFuelAmountVND(quantity, unitPrice);
  return <form action={action} onSubmit={(event) => {
    if (!navigator.onLine) { event.preventDefault(); setOfflineError(true); return; }
    setOfflineError(false);
    if (predicted === null) { event.preventDefault(); setInvalidTotal(true); return; }
    setInvalidTotal(false);
  }} className="card space-y-4">
    {!record && <input name="idempotencyKey" value={keyId} type="hidden" />}
    <header className="border-b border-[#e4eaf2] pb-4"><p className="eyebrow">GHI NHẬN NĂNG LƯỢNG</p><h2 className="section-title mt-1">{record ? "Sửa lần đổ xăng hoặc sạc điện" : "Lần đổ xăng hoặc sạc điện"}</h2><p className="muted mt-1">Chọn xe và nhập lượng, đơn giá. Chi phí được ghi vào sổ một lần.</p></header>
    <label className="block"><span className="label">Phương tiện *</span>{record ? <><p className="font-semibold">{vehicles.find(v => v.id === vehicleId)?.label}</p><input type="hidden" name="vehicleId" value={vehicleId}/></> : <select name="vehicleId" required value={vehicleId} onChange={e => { setVehicleId(e.target.value); const chosen = vehicles.find(v => v.id === e.target.value); setUnit(chosen?.fuelType === "ELECTRIC" ? "KWH" : "LITER"); }}>{vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select>}</label>
    <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Ngày giờ phát sinh *</span><input type="datetime-local" name="occurredAt" defaultValue={record?.occurredAt ?? initialTime} required /></label><label><span className="label">Đồng hồ km *</span><input type="number" name="odometer" min="0" max="1000000000" inputMode="numeric" defaultValue={record?.odometer} required /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Đơn vị năng lượng</span><select name="unit" value={unit} onChange={e => setUnit(e.target.value as "LITER" | "KWH")}><option value="LITER" disabled={vehicle?.fuelType === "ELECTRIC"}>Lít (xăng/dầu)</option><option value="KWH" disabled={vehicle?.fuelType === "PETROL" || vehicle?.fuelType === "DIESEL"}>kWh (sạc điện)</option></select></label><label><span className="label">Số lượng *</span><input name="quantity" type="number" min="0.001" max="999999999999.999" step="0.001" inputMode="decimal" required value={quantity} onChange={e => setQuantity(e.target.value)}/></label></div>
    <label className="block"><span className="label">Đơn giá (VND/{unit === "KWH" ? "kWh" : "lít"}) *</span><input name="unitPrice" type="number" min="0" max="999999999999.999" step="0.001" inputMode="decimal" required value={unitPrice} onChange={e => setUnitPrice(e.target.value)} /></label>
    <div className="amount-well"><p className="eyebrow">TỔNG TIỀN DỰ KIẾN</p><p aria-live="polite" className="money mt-2 text-3xl font-extrabold text-[var(--text-primary)]">{predicted === null ? "—" : BigInt(predicted).toLocaleString("vi-VN")} ₫</p><p className="muted mt-2">Xem trước được làm tròn VND bằng cùng quy tắc với máy chủ khi lưu.</p></div>
    {(invalidTotal || (quantity.length > 0 && unitPrice.length > 0)) && predicted === null && <p role="alert" className="error">Số tiền sau khi làm tròn phải từ 1 đến 999.999.999.999.999 ₫. Vui lòng kiểm tra số lượng và đơn giá trước khi lưu.</p>}
    <label className="flex items-center gap-3"><input name="isFullTank" type="checkbox" className="h-5 w-5" defaultChecked={record?.isFullTank}/><span>Đổ đầy bình / sạc đầy (dùng để xác định chu kỳ tiêu hao)</span></label>
    <label className="block"><span className="label">Trạm xăng / trạm sạc</span><input name="vendor" maxLength={150} defaultValue={record?.vendor ?? ""} /></label>
    {offlineError && <p role="alert" className="error">Bạn đang ngoại tuyến. Khoản nhiên liệu chưa được lưu; kết nối mạng rồi nhấn Lưu để thử lại.</p>}
    {state.error && <p role="alert" className="error">{state.error}</p>}
    <div className="form-submit-sticky"><Save editing={!!record}/></div>
  </form>;
}
