import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.discordId = (profile as any).id;
        token.username = (profile as any).username;
        token.discriminator = (profile as any).discriminator;
        token.avatar = (profile as any).avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).discordId = token.discordId as string;
        (session.user as any).username = token.username as string;
        (session.user as any).discriminator = token.discriminator as string;
        (session.user as any).avatar = token.avatar as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects properly
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt" as const,
  },
};
