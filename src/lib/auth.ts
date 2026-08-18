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

        // Verificar bcrypt hash
        if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
          // Intentar primero con la contraseña exacta, luego sin espacios (autocorrector móvil)
          isMatch = await bcrypt.compare(cleanPassword, user.password);
          if (!isMatch && cleanPassword !== credentials.password.trim()) {
            isMatch = await bcrypt.compare(credentials.password.trim(), user.password);
          }
        } else {
          // Texto plano: migrar a bcrypt
          if (user.password === cleanPassword || user.password === credentials.password.trim()) {
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
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",  // Compatible con iOS Safari y navegadores móviles
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        if (token.name) session.user.name = token.name as string;
        session.user.email = (token.email as string) || session.user.email || "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
