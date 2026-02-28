"use client";

import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convexClient";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
