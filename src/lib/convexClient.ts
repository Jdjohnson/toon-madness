import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

// Lazy init to avoid throwing during Next.js prerendering
let _client: ConvexReactClient | null = null;

export function getConvexClient() {
  if (!_client) {
    _client = new ConvexReactClient(convexUrl);
  }
  return _client;
}
