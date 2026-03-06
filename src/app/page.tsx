"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const FALLBACK_PARTICIPANTS = [
  { name: "Jarsh", slug: "jarsh" },
  { name: "Morgan", slug: "morgan" },
  { name: "Joey", slug: "joey" },
  { name: "Josh", slug: "josh" },
  { name: "David", slug: "david" },
  { name: "Jarad", slug: "jarad" },
];

export default function Home() {
  const convexParticipants = useQuery(api.matchups.getParticipants);
  const router = useRouter();
  const [existing] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("toon-madness-participant");
  });

  useEffect(() => {
    if (!existing) {
      return;
    }
    router.push("/bracket");
  }, [existing, router]);

  // Use Convex data if available and non-empty, otherwise use fallback
  const participants = convexParticipants?.length ? convexParticipants : FALLBACK_PARTICIPANTS;

  if (existing) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-2">
          <span style={{ color: "var(--accent)" }}>TOON</span>{" "}
          <span className="text-white">MADNESS</span>
        </h1>
        <p style={{ color: "var(--text-dim)" }} className="text-lg mt-3">
          32 cartoon legends. 6 voters. One champion.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-2xl w-full">
        {participants.map((p) => (
          <Link
            key={p.slug}
            className="participant-card"
            href={`/bracket?participant=${encodeURIComponent(p.slug)}`}
            onClick={() => {
              localStorage.setItem("toon-madness-participant", p.slug);
            }}
          >
            <img
              src={`/participants/${p.slug}.png`}
              alt={p.name}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="text-lg font-bold text-white">{p.name}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
