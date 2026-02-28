"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MatchupCard from "@/components/MatchupCard";
import WinnerBanner from "@/components/WinnerBanner";

const ROUND_NAMES: Record<number, string> = {
  1: "Round of 32",
  2: "Sweet 16",
  3: "Elite 8",
  4: "Final Four",
  5: "Championship",
};

export default function BracketPage() {
  const bracket = useQuery(api.matchups.getBracket);
  const participants = useQuery(api.matchups.getParticipants);
  const router = useRouter();
  const [participantSlug, setParticipantSlug] = useState<string | null>(null);
  const [activeRound, setActiveRound] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const slug = localStorage.getItem("toon-madness-participant");
    if (!slug) {
      router.push("/");
      return;
    }
    setParticipantSlug(slug);
  }, [router]);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-select the most active round
  useEffect(() => {
    if (!bracket) return;
    for (let r = 5; r >= 1; r--) {
      const roundMatchups = bracket.filter((m) => m.round === r);
      if (roundMatchups.some((m) => m.status === "active")) {
        setActiveRound(r);
        break;
      }
    }
  }, [bracket]);

  if (!participantSlug || !bracket || !participants) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: "var(--text-dim)" }}>Loading bracket...</div>
      </div>
    );
  }

  const currentParticipant = participants.find((p) => p.slug === participantSlug);
  const roundGroups = [1, 2, 3, 4, 5].map((round) =>
    bracket.filter((m) => m.round === round)
  );

  // Check for champion
  const championship = bracket.find((m) => m.round === 5);
  const champion = championship?.status === "decided" ? championship.winner : null;

  function switchParticipant() {
    localStorage.removeItem("toon-madness-participant");
    router.push("/");
  }

  return (
    <div className="min-h-screen">
      {champion && (
        <WinnerBanner
          characterName={champion.name}
          characterShow={champion.show}
          avatarUrl={champion.avatarUrl}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--bg)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black">
            <span style={{ color: "var(--accent)" }}>TOON</span>{" "}
            <span className="text-white">MADNESS</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src={currentParticipant?.avatarUrl || `/participants/${participantSlug}.png`}
              alt={participantSlug}
              className="w-8 h-8 rounded-full object-cover"
              style={{ background: "var(--bg-surface)" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.background = "var(--accent)";
                (e.target as HTMLImageElement).src = "";
              }}
            />
            <span className="font-semibold text-sm">{currentParticipant?.name || participantSlug}</span>
          </div>
          <button
            onClick={switchParticipant}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "var(--bg-card)", color: "var(--text-dim)" }}
          >
            Switch
          </button>
        </div>
      </header>

      {/* Mobile: round tabs */}
      {isMobile && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ background: "var(--bg-surface)" }}>
          {[1, 2, 3, 4, 5].map((round) => (
            <button
              key={round}
              className={`round-tab ${activeRound === round ? "active" : ""}`}
              onClick={() => setActiveRound(round)}
            >
              {ROUND_NAMES[round]}
            </button>
          ))}
        </div>
      )}

      {/* Bracket */}
      {isMobile ? (
        // Mobile: single round view
        <div className="p-4 flex flex-col gap-3">
          <h2 className="text-lg font-bold" style={{ color: "var(--accent)" }}>
            {ROUND_NAMES[activeRound]}
          </h2>
          {roundGroups[activeRound - 1].map((matchup) => (
            <MatchupCard
              key={matchup._id}
              matchup={matchup}
              participantSlug={participantSlug}
            />
          ))}
        </div>
      ) : (
        // Desktop: full bracket view
        <div className="overflow-x-auto p-6">
          <div className="flex gap-2 min-w-max items-start">
            {roundGroups.map((matchups, roundIndex) => {
              const round = roundIndex + 1;
              // Spacing increases per round to align matchups visually
              const gap = round === 1 ? 8 : round === 2 ? 24 : round === 3 ? 72 : round === 4 ? 168 : 0;
              const topPad = round === 1 ? 0 : round === 2 ? 16 : round === 3 ? 56 : round === 4 ? 136 : 0;

              return (
                <div key={round} className="flex flex-col" style={{ minWidth: round === 5 ? 240 : 220 }}>
                  <div
                    className="text-xs font-bold mb-3 px-1 uppercase tracking-wider"
                    style={{ color: "var(--accent)" }}
                  >
                    {ROUND_NAMES[round]}
                  </div>
                  <div
                    className="flex flex-col"
                    style={{ gap, paddingTop: topPad }}
                  >
                    {matchups.map((matchup) => (
                      <MatchupCard
                        key={matchup._id}
                        matchup={matchup}
                        participantSlug={participantSlug}
                        compact={round < 4}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
