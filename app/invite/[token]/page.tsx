import Link from "next/link";
import { auth } from "@/auth";
import { invitationTokenHash, validInvitationToken } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";
import { acceptInvitation } from "@/modules/organizations/invitations";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!validInvitationToken(token)) return <main className="card mx-auto mt-20 max-w-lg">Liên kết mời không hợp lệ.</main>;
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash: invitationTokenHash(token) }, include: { organization: true } });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) return <main className="card mx-auto mt-20 max-w-lg">Lời mời không còn hiệu lực.</main>;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  return <main className="card mx-auto mt-20 max-w-lg space-y-5"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf1fc] text-[#153c88]"><Users size={27}/></div><p className="eyebrow">KHÔNG GIAN CARLOG</p><h1 className="page-title">Lời mời tham gia</h1>
    <p>Không gian: <strong>{invitation.organization.name}</strong></p>
    <p>Tài khoản được mời: <strong>{invitation.email}</strong></p>
    <p className="muted">Tài khoản Google đang đăng nhập phải có email trùng khớp.</p>
    <form action={acceptInvitation.bind(null, token)}><button className="btn w-full">Chấp nhận lời mời</button></form>
    <Link href="/dashboard" className="block text-center text-blue-700">Quay lại</Link>
  </main>;
}
