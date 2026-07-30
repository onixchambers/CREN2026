import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "mi-secreto-super-seguro-cren-2026-prod",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const cleanUsername = credentials.username.trim();
        const cleanPassword = credentials.password.trim();

        const user = await prisma.user.findFirst({
          where: { name: { equals: cleanUsername, mode: 'insensitive' } }
        });

        if (!user || !user.password) {
          return null;
        }

        let isMatch = false;

        // Check bcrypt hash
        if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
          isMatch = await bcrypt.compare(cleanPassword, user.password);
        } else {
          // Check plain text and transparently migrate to bcrypt hash
          if (user.password === cleanPassword || user.password === credentials.password) {
            isMatch = true;
            try {
              const hashedPassword = await bcrypt.hash(cleanPassword, 10);
              await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
              });
            } catch (err) {
              console.error("Error al migrar contraseña a bcrypt:", err);
            }
          }
        }

        if (!isMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email || "",
          image: user.image || "",
          phone: user.phone || "",
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
        token.picture = user.image;
        token.phone = (user as any).phone;
      }
      if (trigger === "update" && session) {
        if (session.email) token.email = session.email;
        if (session.picture) token.picture = session.picture;
        if (session.phone) token.phone = session.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.email = (token.email as string) || session.user.email || "";
        session.user.image = (token.picture as string) || session.user.image || "";
        (session.user as any).phone = (token.phone as string) || "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
