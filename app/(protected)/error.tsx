"use client";

import Link from "next/link";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function ProtectedError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="card mx-auto max-w-lg space-y-4 py-10 text-center">
    <AlertCircle aria-hidden size={34} className="mx-auto text-amber-600"/>
    <h1 className="page-title">Chưa thể tải dữ liệu</h1>
    <p className="muted">Kết nối hoặc dịch vụ có thể đang gián đoạn. Hãy thử tải lại nội dung.</p>
    <div className="flex flex-wrap justify-center gap-3"><button type="button" className="btn" onClick={reset}><RefreshCcw size={16}/>Thử lại</button><Link href="/dashboard" className="btn-secondary">Về tổng quan</Link></div>
  </section>;
}
