"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import MatchupCard from "@/components/MatchupCard";
import type { MatchupData } from "@/components/MatchupCard";
import WinnerBanner from "@/components/WinnerBanner";
import BracketSide from "@/components/BracketSide";
import MatchupDetail from "@/components/MatchupDetail";

const ROUND_NAMES: Record<number, string> = {
  1: "Round of 32",
  2: "Sweet 16",
  3: "Elite 8",
  4: "Final Four",
  5: "Championship",
};

function BracketContent() {
  const bracket = useQuery(api.matchups.getBracket);
  const participants = useQuery(api.matchups.getParticipants);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [participantSlug, setParticipantSlug] = useState<string | null>(null);
  const [activeRound, setActiveRound] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  const selectedMatchupId = searchParams.get("matchup");

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

  const openMatchup = useCallback((matchup: MatchupData) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("matchup", matchup._id);
    router.push(`/bracket?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const closeMatchup = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("matchup");
    const qs = params.toString();
    router.push(qs ? `/bracket?${qs}` : "/bracket", { scroll: false });
  }, [router, searchParams]);

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
  const championshipMatchup = bracket.find((m) => m.round === 5);
  const champion = championshipMatchup?.status === "decided" ? championshipMatchup.winner : null;

  // Split bracket: left side = R1 pos 0-7, R2 pos 0-3, R3 pos 0-1, R4 pos 0
  // Right side = R1 pos 8-15, R2 pos 4-7, R3 pos 2-3, R4 pos 1
  const leftRounds = [
    roundGroups[0].filter((m) => m.position >= 0 && m.position <= 7),
    roundGroups[1].filter((m) => m.position >= 0 && m.position <= 3),
    roundGroups[2].filter((m) => m.position >= 0 && m.position <= 1),
    roundGroups[3].filter((m) => m.position === 0),
  ];
  const rightRounds = [
    roundGroups[0].filter((m) => m.position >= 8 && m.position <= 15),
    roundGroups[1].filter((m) => m.position >= 4 && m.position <= 7),
    roundGroups[2].filter((m) => m.position >= 2 && m.position <= 3),
    roundGroups[3].filter((m) => m.position === 1),
  ];

  // Find the selected matchup for detail overlay
  const selectedMatchup = selectedMatchupId
    ? bracket.find((m) => m._id === selectedMatchupId) ?? null
    : null;

  // Navigation list for prev/next: all non-locked matchups in bracket order
  const navList = bracket.filter((m) => m.status !== "locked");
  const navIndex = selectedMatchup ? navList.findIndex((m) => m._id === selectedMatchup._id) : -1;

  const navigateTo = useCallback((matchup: MatchupData) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("matchup", matchup._id);
    router.replace(`/bracket?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const onPrev = navIndex > 0 ? () => navigateTo(navList[navIndex - 1]) : null;
  const onNext = navIndex >= 0 && navIndex < navList.length - 1 ? () => navigateTo(navList[navIndex + 1]) : null;
  const positionLabel = navIndex >= 0 ? `${navIndex + 1} of ${navList.length}` : undefined;

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
        // Mobile: single round view (unchanged)
        <div className="p-4 flex flex-col gap-3">
          <h2 className="text-lg font-bold" style={{ color: "var(--accent)" }}>
            {ROUND_NAMES[activeRound]}
          </h2>
          {roundGroups[activeRound - 1].map((matchup) => (
            <MatchupCard
              key={matchup._id}
              matchup={matchup}
              participantSlug={participantSlug}
              onClick={() => openMatchup(matchup)}
            />
          ))}
        </div>
      ) : (
        // Desktop: split bracket with left/center/right
        <div className="overflow-x-auto p-6">
          <div className="flex gap-2 min-w-max items-start justify-center">
            {/* Left side: R1→R4 converging to center */}
            <BracketSide
              rounds={leftRounds}
              participantSlug={participantSlug}
              onMatchupClick={openMatchup}
              side="left"
            />

            {/* Championship center column */}
            <div className="flex flex-col items-center" style={{ minWidth: 240 }}>
              <div
                className="round-header text-xs font-bold mb-3 px-1 uppercase tracking-wider text-center"
                style={{ color: "var(--gold)" }}
              >
                Championship
              </div>
              <div style={{ paddingTop: 136 }}>
                {championshipMatchup && (
                  <MatchupCard
                    matchup={championshipMatchup}
                    participantSlug={participantSlug}
                    championship
                    onClick={() => openMatchup(championshipMatchup)}
                  />
                )}
              </div>
            </div>

            {/* Right side: R4→R1 diverging from center */}
            <BracketSide
              rounds={rightRounds}
              participantSlug={participantSlug}
              onMatchupClick={openMatchup}
              side="right"
            />
          </div>
        </div>
      )}

      {/* Matchup detail overlay */}
      {selectedMatchup && (
        <MatchupDetail
          matchup={selectedMatchup}
          participantSlug={participantSlug}
          onClose={closeMatchup}
          onPrev={onPrev}
          onNext={onNext}
          positionLabel={positionLabel}
        />
      )}
    </div>
  );
}

export default function BracketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: "var(--text-dim)" }}>Loading bracket...</div>
      </div>
    }>
      <BracketContent />
    </Suspense>
  );
}
