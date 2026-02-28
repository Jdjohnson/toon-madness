"use client";

import { ConvexProvider } from "convex/react";
import { getConvexClient } from "@/lib/convexClient";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <ConvexProvider client={getConvexClient()}>{children}</ConvexProvider>;
}
