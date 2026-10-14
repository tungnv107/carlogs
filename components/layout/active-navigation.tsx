"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { LayoutDashboard, CarFront, ReceiptText, Plus, Fuel, Route, Wrench, ChartNoAxesCombined, Menu, Bell, Users, UserRound, X, ArrowUpRight } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/vehicles", label: "Phương tiện", icon: CarFront },
  { href: "/expenses", label: "Sổ chi phí", icon: ReceiptText },
  { href: "/fuel", label: "Nhiên liệu / sạc", icon: Fuel },
  { href: "/trips", label: "Hành trình", icon: Route },
  { href: "/maintenance", label: "Bảo dưỡng & giấy tờ", icon: Wrench },
  { href: "/reports", label: "Báo cáo", icon: ChartNoAxesCombined },
  { href: "/notifications", label: "Nhắc hạn", icon: Bell },
  { href: "/account", label: "Tài khoản", icon: UserRound },
  { href: "/settings/members", label: "Thành viên", icon: Users }
];

const matches = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export function ActiveSidebar({ canAddExpense, canManageMembers }: { canAddExpense: boolean; canManageMembers: boolean }) {
  const path = usePathname();
  const visible = items.filter(item => canManageMembers || item.href !== "/settings/members");
  return <nav className="sidebar-nav mt-9 flex-1 space-y-1" aria-label="Điều hướng chính">
    <p className="nav-group-label">KHÔNG GIAN LÀM VIỆC</p>
    {visible.slice(0, 7).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="nav-link" data-active={matches(path, href)} aria-current={matches(path, href) ? "page" : undefined}><Icon size={19} strokeWidth={1.8}/><span>{label}</span></Link>)}
    {canAddExpense && <Link href="/expenses/new" className="sidebar-add mt-4"><Plus size={19}/> Thêm khoản chi <ArrowUpRight size={16} className="ml-auto opacity-70"/></Link>}
    <p className="nav-group-label !mt-7">TÀI KHOẢN & HỖ TRỢ</p>
    {visible.slice(7).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="nav-link" data-active={matches(path, href)} aria-current={matches(path, href) ? "page" : undefined}><Icon size={19} strokeWidth={1.8}/><span>{label}</span></Link>)}
  </nav>;
}

export function MobileNavigation({ canAddExpense, canManageMembers }: { canAddExpense: boolean; canManageMembers: boolean }) {
  const path = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const primary = [items[0], items[1], ...(canAddExpense ? [{ href: "/expenses/new", label: "Thêm", icon: Plus }] : []), { ...items[2], label: "Lịch sử" }];
  const moreItems = items.slice(3).filter(item => canManageMembers || item.href !== "/settings/members");
  const moreActive = moreItems.some(item => matches(path, item.href));
  return <>
    <nav className="mobile-glass-nav lg:hidden" aria-label="Điều hướng di động">
      {primary.map(({ href, label, icon: Icon }) => { const active = href === "/expenses" ? path === "/expenses" || (path.startsWith("/expenses/") && path !== "/expenses/new") : matches(path, href); return <Link key={href} href={href} className="mobile-link" data-active={active} data-add={href === "/expenses/new"} aria-current={active ? "page" : undefined}>
        <span className="mobile-icon"><Icon size={href === "/expenses/new" ? 23 : 21} strokeWidth={href === "/expenses/new" ? 2.5 : 1.85}/></span><span>{label}</span>
      </Link>; })}
      <button type="button" className="mobile-link" data-active={moreActive} onClick={() => dialog.current?.showModal()} aria-label="Mở thêm chức năng" aria-haspopup="dialog">
        <span className="mobile-icon"><Menu size={21} strokeWidth={1.85}/></span><span>Khác</span>
      </button>
    </nav>
    <dialog ref={dialog} className="mobile-filter-dialog" aria-label="Các chức năng khác" onClick={event => { if (event.target === dialog.current) dialog.current?.close(); }}>
      <section className="mobile-filter-sheet mobile-more-sheet" role="document">
        <div className="mx-auto mb-5 h-1 w-11 rounded-full bg-slate-300" aria-hidden/>
        <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">CARLOG WORKSPACE</p><h2 className="mt-1 text-xl font-extrabold">Khám phá thêm</h2></div><button type="button" className="icon-button" onClick={() => dialog.current?.close()} aria-label="Đóng"><X size={20}/></button></div>
        <div className="grid grid-cols-2 gap-3">{moreItems.map(({ href, label, icon: Icon }) => <Link href={href} key={href} onClick={() => dialog.current?.close()} className="more-item" aria-current={matches(path, href) ? "page" : undefined}><Icon size={21}/><span>{label}</span></Link>)}</div>
      </section>
    </dialog>
  </>;
}
