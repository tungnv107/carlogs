import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { InviteForm } from "@/components/forms/invite-form";
import { updateMemberRole, toggleMemberAccess, cancelInvitation } from "@/modules/organizations/invitations";
import { ConfirmSubmit } from "@/components/forms/confirm-submit";
import { PageHeader } from "@/components/ui/page-header";
import { MailPlus, ShieldCheck, UsersRound } from "lucide-react";

const roleLabels: Record<string, string> = { OWNER: "Chủ sở hữu", ADMIN: "Quản trị", MANAGER: "Quản lý", ACCOUNTANT: "Kế toán", DRIVER: "Tài xế", VIEWER: "Chỉ xem" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess(["OWNER", "ADMIN"]);
  const params = await searchParams;
  const [members, invitations] = await Promise.all([
    prisma.organizationMember.findMany({ where: { organizationId: organization.id }, include: { user: true } }),
    prisma.invitation.findMany({ where: { organizationId: organization.id, acceptedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 30 })
  ]);
  return <section className="mx-auto max-w-3xl space-y-5">
    <Link href="/account" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-deep)]">← Tài khoản</Link>
    <PageHeader eyebrow="QUẢN TRỊ KHÔNG GIAN" title={`Thành viên · ${organization.name}`} description={`Quyền hiện tại: ${membership.role}. Lời mời chỉ được chấp nhận bởi tài khoản Google có email được mời.`}/>
    {params.updated && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-800">Đã cập nhật quyền thành viên hoặc lời mời.</p>}
    <div className="insight-band flex flex-wrap items-center gap-4"><span className="account-profile-icon grid h-12 w-12 place-items-center rounded-xl"><ShieldCheck size={24}/></span><div className="min-w-0 flex-1"><p className="font-bold">Phân quyền theo không gian làm việc</p><p className="muted">Thành viên chỉ truy cập dữ liệu theo vai trò được cấp. Mời người dùng bằng email Google chính xác.</p></div><span className="badge badge-neutral">{roleLabels[membership.role] ?? membership.role}</span></div>
    <InviteForm />
    <div className="card"><h2 className="section-title flex items-center gap-2"><UsersRound aria-hidden size={20} className="text-[var(--brand-primary)]"/>Thành viên ({members.length})</h2><ul className="divider-list mt-3">{members.map(m => {
      const canManageMember = m.userId !== user.id && m.role !== "OWNER" && (membership.role === "OWNER" || m.role !== "ADMIN");
      const roleOptions = membership.role === "OWNER" ? ["ADMIN", "MANAGER", "ACCOUNTANT", "DRIVER", "VIEWER"] : ["MANAGER", "ACCOUNTANT", "DRIVER", "VIEWER"];
      return <li key={m.userId} className="member-row flex flex-wrap items-center gap-3 py-4"><span className="member-avatar" aria-hidden>{(m.user.name ?? m.user.email ?? "U").slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="font-semibold break-words">{m.user.name ?? m.user.email}</p><p className="muted break-all">{m.user.email}</p></div><div className="flex flex-wrap gap-2"><span className="badge badge-neutral">{roleLabels[m.role] ?? m.role}</span><span className={`badge ${m.status === "ACTIVE" ? "badge-success" : "badge-warning"}`}>{m.status === "ACTIVE" ? "Đang hoạt động" : m.status === "SUSPENDED" ? "Đã thu hồi quyền" : "Chưa kích hoạt"}</span></div>{canManageMember && <div className="flex w-full flex-wrap items-end gap-2 pl-2 sm:pl-14"><form action={updateMemberRole.bind(null, m.userId)} className="flex flex-wrap items-end gap-2"><label><span className="label">Đổi vai trò</span><select name="role" defaultValue={m.role}>{roleOptions.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label><button className="btn-secondary" type="submit">Cập nhật</button></form><form action={toggleMemberAccess.bind(null, m.userId)}>{m.status === "ACTIVE" ? <ConfirmSubmit prompt={`Thu hồi quyền truy cập của ${m.user.email}? Xe được phân công sẽ chuyển về trạng thái chưa gán.`}>Thu hồi quyền</ConfirmSubmit> : <button type="submit" className="btn-secondary">Kích hoạt lại</button>}</form></div>}</li>;
    })}</ul></div>
    {invitations.length > 0 && <div className="card"><h2 className="section-title flex items-center gap-2"><MailPlus aria-hidden size={20} className="text-[var(--brand-primary)]"/>Lời mời đang hiệu lực</h2><ul className="divider-list mt-3">{invitations.map(inv => <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><span className="min-w-0 break-all font-semibold">{inv.email}</span><span className="muted">{roleLabels[inv.role] ?? inv.role} · Hết hạn {inv.expiresAt.toLocaleDateString("vi-VN")}</span><form action={cancelInvitation.bind(null, inv.id)}><ConfirmSubmit prompt={`Hủy lời mời gửi tới ${inv.email}?`}>Hủy lời mời</ConfirmSubmit></form></li>)}</ul></div>}
  </section>;
}
