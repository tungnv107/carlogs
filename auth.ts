import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { withoutOAuthSecrets } from "@/lib/auth-account";

const adapter = PrismaAdapter(prisma);
const baseLinkAccount = adapter.linkAccount?.bind(adapter);
if (baseLinkAccount) {
  adapter.linkAccount = (account) => baseLinkAccount(withoutOAuthSecrets(account));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "database" },
  providers: [Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: { params: { scope: "openid email profile" } }
  })],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || profile?.email_verified !== true) return false;
      const identity = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider: "google", providerAccountId: account.providerAccountId } },
        include: { user: true }
      });
      return identity?.user.status !== "DISABLED";
    },
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    }
  }
});
