import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return <main className="grid min-h-[65vh] place-items-center px-4"><section className="card w-full max-w-lg space-y-4 py-12 text-center"><FileQuestion className="mx-auto text-blue-700" size={38}/><p className="eyebrow">404 · CARLOG</p><h1 className="page-title">Không tìm thấy trang</h1><p className="muted">Đường dẫn có thể đã thay đổi hoặc nội dung không tồn tại trong phạm vi truy cập của bạn.</p><Link href="/dashboard" className="btn">Về tổng quan</Link></section></main>;
}
