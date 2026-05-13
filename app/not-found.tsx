"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { track } from "@/lib/plausible";

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    track("404", { path: pathname ?? "/" });
  }, [pathname]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-white" style={{ background: "#080808" }}>
      <p className="text-6xl font-bold tracking-tight">404</p>
      <p className="text-neutral-400 text-sm">Page not found</p>
      <Link
        href="/"
        className="mt-2 text-sm border border-neutral-700 hover:border-neutral-500 px-4 py-2 rounded transition-colors text-neutral-300 hover:text-white"
      >
        Go home
      </Link>
    </main>
  );
}
