import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendAccountCreationNotification } from "@/lib/email";
import { authConfig as edgeAuthConfig } from "@/lib/auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authConfig = {
  ...edgeAuthConfig,
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV !== "production" ? true : undefined,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account: _account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
        (token as any).phone = (user as any).phone || null;
      }
      
      // Always fetch the latest role (and phone) from the database to ensure it's up to date
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, phone: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            console.log(`[NextAuth] Updated token role to: ${dbUser.role}`);
            (token as any).phone = dbUser.phone || null;
          }
        } catch (error) {
          console.error("[NextAuth] Error fetching user role:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phone = (token as any).phone || null;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Credentials (email/password) only; no OAuth
      if (account?.provider === "credentials") {
        return true;
      }
      return true;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
export { authConfig };

