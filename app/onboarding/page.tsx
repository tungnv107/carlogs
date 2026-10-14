import { requireSession } from "@/modules/auth/guards";
import { createPersonalWorkspace } from "@/modules/organizations/actions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CarFront, ShieldCheck } from "lucide-react";

export default async function Onboarding() {
  const user = await requireSession();
  if (await prisma.organizationMember.count({ where: { userId: user.id, status: "ACTIVE" } })) redirect("/dashboard");
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fc] px-4 py-12">
    <section className="card w-full max-w-xl !p-7 sm:!p-10"><div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1fc] text-[#153c88]"><CarFront size={29}/></div><p className="eyebrow">BƯỚC ĐẦU TIÊN · CARLOG</p>
      <h1 className="page-title mt-3">Tạo không gian quản lý riêng</h1>
      <p className="muted mt-3">Bắt đầu với không gian dành cho bạn. Phương tiện và chi phí chỉ hiển thị theo quyền được cấp.</p>
      <form action={createPersonalWorkspace} className="mt-8 space-y-5">
        <label className="block"><span className="label">Tên không gian</span><input name="name" minLength={2} maxLength={100} defaultValue={user.name ? `Xe của ${user.name}` : "Xe của tôi"} required /></label>
        <button type="submit" className="btn w-full">Tạo không gian và bắt đầu →</button>
      </form>
      <p className="muted mt-6 flex items-center gap-2"><ShieldCheck size={17} className="text-teal"/>Thông tin được bảo vệ theo từng không gian.</p>
    </section>
  </main>;
}
