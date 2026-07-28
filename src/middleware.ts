import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || "mi-secreto-super-seguro-cren-2026-prod";
  const token = await getToken({ req, secret });
  const { pathname } = req.nextUrl;

  // Protect all /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = ((token.role as string) || "ADMIN").toUpperCase();

    // Restrict Admin-only routes for Therapists
    const adminOnlyRoutes = [
      "/dashboard/pacientes",
      "/dashboard/finanzas",
      "/dashboard/terapeutas",
      "/dashboard/honorarios",
      "/dashboard/salario",
      "/dashboard/reportes",
      "/dashboard/estado-resultados",
      "/dashboard/configuracion"
    ];

    if (role === "TERAPEUTA") {
      if (adminOnlyRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
        return NextResponse.redirect(new URL("/dashboard/agenda", req.url));
      }
    }

    if (role === "CONTADOR") {
      const allowedForContador = [
        "/dashboard/finanzas",
        "/dashboard",
        "/dashboard/terapeutas",
        "/dashboard/honorarios",
        "/dashboard/salario",
        "/dashboard/reportes",
        "/dashboard/estado-resultados",
        "/dashboard/contrasena"
      ];
      const isAllowed = allowedForContador.some(route => pathname === route || pathname.startsWith(route + "/"));
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/dashboard/finanzas", req.url));
      }
    }

    if (role === "INVITADO") {
      if (pathname.startsWith("/dashboard/configuracion")) {
        return NextResponse.redirect(new URL("/dashboard/agenda", req.url));
      }
    }

    if (role === "ADMIN" || role === "ADMINISTRADOR") {
      if (pathname.startsWith("/dashboard/contrasena")) {
        return NextResponse.redirect(new URL("/dashboard/configuracion", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
