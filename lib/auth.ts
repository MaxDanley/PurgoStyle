import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendAccountCreationNotification } from "@/lib/email";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV !== "production" ? true : undefined,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
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
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
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
    async signIn({ user, account, profile }) {
      console.log("[NextAuth] SignIn callback:", { user, account, profile });
      
      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        // Ensure user.id is available
        if (!user.id) {
          console.error("[NextAuth] User ID is missing in Google sign-in");
          return false;
        }

        // Check if a user already exists with this email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { accounts: true },
        });

        // Determine which userId to use (must be a string)
        const targetUserId: string = existingUser?.id || user.id;

        // Check if account already exists
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        // Check if this is a new user (no existing user OR user has no accounts yet)
        // PrismaAdapter may have already created the user, so we check if they have any accounts
        const isNewUser = !existingUser || (existingUser && existingUser.accounts.length === 0);

        // Use upsert to handle both create and update cases safely
        // This prevents the duplicate key error from PrismaAdapter
        const upsertResult = await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            userId: targetUserId, // Ensure correct user linkage
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state ? String(account.session_state) : null,
          },
          create: {
            userId: targetUserId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state ? String(account.session_state) : null,
          },
        });

        if (existingAccount) {
          console.log("[NextAuth] Updated existing Google account");
        } else {
          console.log("[NextAuth] Created/linked Google account");
        }

        // Send notification to support if this is a new user (non-blocking)
        // Check if account was just created (not updated) and user has no other accounts
        if (!existingAccount && isNewUser) {
          try {
            // Get the user to ensure we have the latest info
            const currentUser = await prisma.user.findUnique({
              where: { id: targetUserId },
            });
            
            await sendAccountCreationNotification(
              currentUser?.email || user.email!,
              currentUser?.name || user.name || "Google User",
              currentUser?.phone || undefined
            );
          } catch (supportEmailError) {
            // Log but don't fail - support notification is non-critical
            console.error("Failed to send support notification for new Google user (non-critical):", supportEmailError);
          }
        }

        // Return true to allow sign-in
        // PrismaAdapter will see the account exists and won't try to create a duplicate
        return true;
      }
      
      // Handle credentials sign-in
      if (account?.provider === "credentials") {
        // Check if user has a Google account linked
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { accounts: true },
        });

        if (existingUser && existingUser.accounts.some(acc => acc.provider === "google")) {
          // User has a Google account, should use that instead
          throw new Error("Please sign in with Google. Your account is linked to Google authentication.");
        }
        
        return true;
      }
      
      return true;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
export { authConfig };

