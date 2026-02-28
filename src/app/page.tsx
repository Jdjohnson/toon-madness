"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const participants = useQuery(api.matchups.getParticipants);
  const router = useRouter();
  const [existing, setExisting] = useState<string | null>(null);

  useEffect(() => {
    const slug = localStorage.getItem("toon-madness-participant");
    if (slug) setExisting(slug);
  }, []);

  function pickParticipant(slug: string) {
    localStorage.setItem("toon-madness-participant", slug);
    router.push("/bracket");
  }

  if (existing) {
    router.push("/bracket");
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
        {participants?.map((p) => (
          <button
            key={p.slug}
            className="participant-card"
            onClick={() => pickParticipant(p.slug)}
          >
            <img
              src={p.avatarUrl || `/participants/${p.slug}.png`}
              alt={p.name}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="text-lg font-bold text-white">{p.name}</div>
            <div
              className="text-xs mt-1"
              style={{ color: "var(--text-dim)" }}
            >
              {p.description}
            </div>
          </button>
        ))}
      </div>

      {!participants && (
        <div className="text-center" style={{ color: "var(--text-dim)" }}>
          Loading...
        </div>
      )}
    </main>
  );
}
