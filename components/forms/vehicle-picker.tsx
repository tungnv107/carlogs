"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type VehicleOption = { id: string; label: string };

export function VehiclePicker({ vehicles, selectedVehicle }: { vehicles: VehicleOption[]; selectedVehicle?: string }) {
  const [selected, setSelected] = useState(selectedVehicle && vehicles.some(v => v.id === selectedVehicle) ? selectedVehicle : vehicles[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const matching = useMemo(() => {
    const text = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!text) return vehicles;
    return vehicles.filter(v => v.id === selected || v.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(text));
  }, [query, vehicles, selected]);

  return <div className="space-y-2">
    {vehicles.length > 5 && <div className="relative"><Search size={18} aria-hidden className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"/><input type="search" aria-label="Tìm nhanh biển số hoặc tên xe" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo biển số hoặc tên xe..." className="pl-11" style={{ paddingLeft: 42 }}/></div>}
    <select name="vehicleId" aria-label="Phương tiện" required value={selected} onChange={e => setSelected(e.target.value)}><option value="" disabled>Chọn phương tiện</option>{matching.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select>
    {query && <p className="muted" role="status">{matching.filter(v => v.id !== selected).length} xe khác phù hợp. Xóa từ khóa để xem tất cả.</p>}
  </div>;
}
