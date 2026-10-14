import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { ArrowUpRight, CarFront, ChartNoAxesCombined, Check, Fuel, ShieldCheck, Wallet } from "lucide-react";
import { safeCallbackPath } from "@/lib/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; callbackUrl?: string }> }) {
  const { error, callbackUrl } = await searchParams;
  const destination = safeCallbackPath(callbackUrl);
  if (await auth()) redirect(destination);
  return <main className="login-page relative isolate flex min-h-dvh w-full items-center overflow-hidden p-4 max-[375px]:pb-6 max-[375px]:pt-[5.75rem] sm:p-8">
    <div className="absolute right-5 top-5 z-20 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 lg:max-xl:right-20 lg:max-xl:top-20"><ThemeToggle /></div>
    <div aria-hidden className="login-aurora pointer-events-none absolute -right-40 -top-56 h-[38rem] w-[38rem] rounded-full"/>
    <div className="login-glass relative mx-auto grid w-full min-w-0 max-w-6xl grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[30px] border lg:min-h-[680px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <aside className="login-hero relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full border-[50px] border-[#ffffff0c]"/>
        <div className="relative flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><CarFront size={27}/></span><strong className="text-2xl tracking-tight">CarLog<span className="text-[#69dfd3]">.</span></strong></div>
        <div className="relative space-y-5"><p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-100">NỀN TẢNG QUẢN LÝ VẬN HÀNH</p><h2 className="max-w-md text-5xl font-extrabold leading-[1.2] tracking-tight">Mỗi chuyến đi.<br/><span className="text-[#89e8dd]">Mọi khoản chi.</span><br/>Một nơi quản lý.</h2><p className="max-w-sm text-base leading-8 text-[#c5d7f2]">Theo dõi phương tiện, kiểm soát chi phí thực tế và đưa ra quyết định dựa trên dữ liệu.</p>
          <div className="grid gap-2"><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4"><Wallet size={21} className="text-[#89e8dd]"/> Sổ chi phí tập trung</div><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4"><Fuel size={21} className="text-[#89e8dd]"/> Nhiên liệu & bảo dưỡng rõ ràng</div><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4"><ChartNoAxesCombined size={21} className="text-[#89e8dd]"/> Báo cáo chi tiết, trực quan</div></div>
        </div><p className="relative text-xs text-[#a9c1e0]">CarLog · Quản lý phương tiện thông minh</p>
      </aside>
      <section className="login-content flex min-w-0 flex-col justify-center px-6 py-12 max-[375px]:py-8 sm:px-12 lg:px-14">
      <div className="mb-10 inline-flex items-center gap-2 self-start text-xl font-extrabold text-[var(--brand-deep)] max-[375px]:mb-7 lg:hidden"><CarFront size={26}/>CarLog<span className="text-teal">.</span></div>
      <span className="eyebrow">CHÀO MỪNG QUAY LẠI</span>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl">Quản lý mọi chuyến đi, dễ dàng hơn.</h1>
      <p className="mt-4 leading-7 text-[var(--muted)]">Đăng nhập bằng tài khoản Google để tiếp tục quản lý phương tiện và chi phí của bạn.</p>
      <div className="login-trust mt-7 flex items-center gap-3 rounded-2xl border p-4 text-sm"><Check size={22} className="shrink-0 text-teal"/><span>Dữ liệu được quản lý theo không gian làm việc và quyền truy cập của bạn.</span></div>
      {error && <p role="alert" className="error mt-5">Đăng nhập chưa thành công hoặc tài khoản không được phép truy cập. Vui lòng thử lại.</p>}
      <form className="mt-8" action={async () => { "use server"; await signIn("google", { redirectTo: destination }); }}>
        <button className="btn min-h-14 w-full text-base" type="submit"><span className="grid h-8 w-8 place-items-center rounded-full bg-white font-bold text-blue-600">G</span> Tiếp tục với Google <ArrowUpRight size={19}/></button>
      </form>
      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-[var(--muted)]"><ShieldCheck size={19} className="shrink-0 text-teal" /> Chỉ sử dụng hồ sơ Google cơ bản để xác thực. Ứng dụng không truy cập nội dung Gmail.</p>
      </section>
    </div>
  </main>;
}
