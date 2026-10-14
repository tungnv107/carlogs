import { requireOrganizationAccess } from "@/modules/auth/guards";
import { signOut } from "@/auth";
import Link from "next/link";
import { Bell, ChartNoAxesCombined, ChevronRight, Fuel, LogOut, Route, UserRound, Users, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { switchOrganization } from "@/modules/organizations/actions";

export default async function Account() {
  const { user, organization, membership } = await requireOrganizationAccess();
  const workspaces = await prisma.organizationMember.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { organization: true },
    orderBy: { organization: { name: "asc" } }
  });
  const links = [
    { href: "/fuel", label: "Nhiên liệu và sạc", icon: Fuel },
    { href: "/trips", label: "Hành trình", icon: Route },
    { href: "/maintenance", label: "Bảo dưỡng và giấy tờ", icon: Wrench },
    { href: "/reports", label: "Báo cáo", icon: ChartNoAxesCombined },
    { href: "/notifications", label: "Trung tâm nhắc hạn", icon: Bell },
    ...(["OWNER", "ADMIN"].includes(membership.role) ? [{ href: "/settings/members", label: "Thành viên và lời mời", icon: Users }] : [])
  ];
  return <section className="mx-auto max-w-3xl space-y-5">
    <PageHeader eyebrow="TÀI KHOẢN & KHÔNG GIAN" title="Tài khoản của tôi" description="Quản lý không gian làm việc và truy cập nhanh các nghiệp vụ."/>
    <section className="card account-profile flex items-start gap-4"><div className="account-profile-icon grid h-14 w-14 shrink-0 place-items-center rounded-2xl"><UserRound size={27}/></div><div className="min-w-0"><p className="eyebrow">HỒ SƠ GOOGLE</p><h2 className="mt-1 break-words text-lg font-bold">{user.name ?? "Người dùng"}</h2><p className="muted break-all">{user.email}</p><span className="badge badge-success mt-3">{membership.role}</span><p className="muted mt-2">Không gian: <strong className="text-[var(--text-primary)]">{organization.name}</strong></p></div></section>
    {workspaces.length > 1 && <section className="card space-y-3"><h2 className="section-title">Chuyển không gian làm việc</h2><p className="muted">Chọn tổ chức mà bạn đang tham gia. Dữ liệu sẽ hiển thị theo quyền của không gian được chọn.</p><form action={switchOrganization} className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="min-w-0 flex-1"><span className="label">Không gian</span><select name="organizationId" defaultValue={organization.id} required>{workspaces.map((item) => <option key={item.organizationId} value={item.organizationId}>{item.organization.name}</option>)}</select></label><button className="btn shrink-0" type="submit">Chuyển không gian</button></form></section>}
    <section className="card"><h2 className="section-title">Menu chức năng</h2><div className="divider-list mt-3">{links.map(({href, label, icon: Icon}) => <Link key={href} href={href} className="account-menu-row flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold"><Icon size={20} className="text-[var(--brand-primary)]"/><span className="flex-1">{label}</span><ChevronRight size={18} className="text-[var(--text-secondary)]"/></Link>)}</div></section>
    <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><button className="btn-secondary w-full sm:w-auto"><LogOut size={17}/>Đăng xuất</button></form>
  </section>;
}
