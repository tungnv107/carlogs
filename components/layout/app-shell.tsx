import Link from "next/link";
import Image from "next/image";
import { Bell, LogOut, ChevronDown, Sparkles } from "lucide-react";
import { signOut } from "@/auth";
import { switchOrganization } from "@/modules/organizations/actions";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import { Connectivity } from "@/components/layout/connectivity";
import { ActiveSidebar, MobileNavigation } from "@/components/layout/active-navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export async function AppShell({ children, user, organizationId, organizationName }: {
  children: React.ReactNode; user: User; organizationId: string; organizationName: string;
}) {
  const memberships = await prisma.organizationMember.findMany({ where: { userId: user.id, status: "ACTIVE" }, include: { organization: true } });
  const current = memberships.find(member => member.organizationId === organizationId);
  const canAddExpense = !!current && current.role !== "VIEWER";
  const canManageMembers = !!current && ["OWNER", "ADMIN"].includes(current.role);
  return <div className="app-frame min-h-screen lg:flex">
    <aside className="app-sidebar hidden shrink-0 flex-col lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[254px] xl:w-[274px]">
      <Link href="/dashboard" className="brand-mark" aria-label="CarLog - Tổng quan"><span className="brand-symbol"><Image src="/icons/logo.png" alt="" width={42} height={42} priority className="h-[42px] w-[42px] object-contain" /></span><span><strong className="block text-[22px] font-extrabold tracking-[-.06em]">CarLog<span className="text-[var(--accent-cyan)]">.</span></strong><small className="block text-[9px] font-bold tracking-[.19em] opacity-60">FLEET INTELLIGENCE</small></span></Link>
      <ActiveSidebar canAddExpense={canAddExpense} canManageMembers={canManageMembers}/>
      <div className="sidebar-note"><Sparkles size={18}/><p className="mt-2 text-sm font-bold">Thông tin trong tầm tay</p><p className="mt-1 text-xs leading-relaxed opacity-70">Tập trung phương tiện, giao dịch và nhắc hạn trong một nơi.</p></div>
    </aside>
    <div className="min-w-0 flex-1">
      <Connectivity />
      <div className="topbar-wrap">
        <header className="app-topbar flex min-h-[68px] items-center justify-between gap-3 px-3 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-3"><Link href="/dashboard" className="topbar-brand lg:hidden" aria-label="CarLog - Tổng quan"><Image src="/icons/logo.png" alt="" width={36} height={36} priority className="h-9 w-9 object-contain" /></Link><div className="min-w-0"><p className="hidden text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted)] sm:block">KHÔNG GIAN LÀM VIỆC</p><p className="truncate text-[13px] font-bold sm:text-sm">{organizationName}</p></div></div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {memberships.length > 1 && <form action={switchOrganization} className="hidden items-center gap-1 xl:flex"><label className="sr-only" htmlFor="organizationId">Chọn không gian</label><select id="organizationId" name="organizationId" defaultValue={organizationId} className="!w-40 !min-h-10 !py-1 text-xs">{memberships.map(m => <option key={m.organizationId} value={m.organizationId}>{m.organization.name}</option>)}</select><button className="btn-secondary !min-h-10 !px-3">Đổi</button></form>}
            <ThemeToggle />
            <Link href="/notifications" className="icon-button" aria-label="Thông báo và nhắc hạn"><Bell size={20} strokeWidth={1.9}/></Link>
            <Link href="/account" className="account-chip" aria-label="Tài khoản">{user.image ? <Image unoptimized width={36} height={36} src={user.image} alt="Ảnh đại diện" className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="account-avatar">{(user.name ?? "U").slice(0, 1)}</span>}<span className="hidden max-w-28 truncate text-xs font-semibold xl:inline">{user.name ?? user.email}</span><ChevronDown className="hidden opacity-50 xl:block" size={15}/></Link>
            <form className="hidden sm:block" action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><button className="icon-button" aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={19}/></button></form>
          </div>
        </header>
      </div>
      <main className="app-main mx-auto max-w-[1512px] space-y-6 px-4 pb-28 pt-6 sm:px-7 lg:px-9 lg:pb-12 lg:pt-8">{children}</main>
    </div>
    <MobileNavigation canAddExpense={canAddExpense} canManageMembers={canManageMembers}/>
  </div>;
}
