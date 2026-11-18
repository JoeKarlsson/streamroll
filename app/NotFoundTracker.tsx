"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/plausible";

// Client half of not-found.tsx, which stays a server component so it can export metadata.
export function NotFoundTracker() {
  const pathname = usePathname();

  useEffect(() => {
    track("404", { path: pathname ?? "/" });
  }, [pathname]);

  return null;
}
