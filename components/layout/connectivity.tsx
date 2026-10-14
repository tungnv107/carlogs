"use client";

import { useEffect, useState } from "react";

/** Network hints, never represent a form submission as successfully saved. */
export function Connectivity() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker?.register("/sw.js").catch(() => {});
    }
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  return offline ? <div role="status" aria-live="polite" className="bg-amber-100 px-4 py-3 text-center text-sm font-semibold text-amber-900">Bạn đang ngoại tuyến. Dữ liệu nhập chưa được lưu lên máy chủ; hãy kết nối lại trước khi gửi.</div> : null;
}
