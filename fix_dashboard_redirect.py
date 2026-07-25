import os

path = 'src/app/dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_imports = '''"use client";
import { useState, useEffect } from "react";'''

new_imports = '''"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";'''

old_body_start = '''export default function DashboardPage() {
  const formatDateStr = (dateStr: string) => {'''

new_body_start = '''export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role || "ADMIN";
      if (role.toUpperCase() === "TERAPEUTA") {
        router.push("/dashboard/agenda");
      }
    }
  }, [session, status, router]);

  const formatDateStr = (dateStr: string) => {'''

content = content.replace(old_imports, new_imports).replace(old_body_start, new_body_start)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
