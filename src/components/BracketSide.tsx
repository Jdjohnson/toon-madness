"use client";

import MatchupCard from "@/components/MatchupCard";
import type { MatchupData } from "@/components/MatchupCard";

const ROUND_NAMES: Record<number, string> = {
  1: "Round of 32",
  2: "Sweet 16",
  3: "Elite 8",
  4: "Final Four",
};

const GAPS = [8, 24, 72, 0];
const TOP_PADS = [0, 16, 56, 136];

interface BracketSideProps {
  rounds: MatchupData[][]; // 4 arrays (R1–R4) in visual order (outermost first)
  participantSlug: string;
  onMatchupClick: (matchup: MatchupData) => void;
  side: "left" | "right";
}

export default function BracketSide({ rounds, participantSlug, onMatchupClick, side }: BracketSideProps) {
  // rounds[0] = outermost (R1 on left, R1 on right)
  // rounds[3] = nearest center (R4)
  // Visual order: left side renders 0→3 (R1→R4), right renders 0→3 (R1→R4) but we reverse columns
  const columns = side === "left" ? rounds : [...rounds].reverse();
  // Round numbers for headers: left = [1,2,3,4], right reversed = [4,3,2,1]
  const roundNumbers = side === "left" ? [1, 2, 3, 4] : [4, 3, 2, 1];
  // Gap/pad indices: left = [0,1,2,3], right reversed = [3,2,1,0]
  const gapIndices = side === "left" ? [0, 1, 2, 3] : [3, 2, 1, 0];

  return (
    <div className="flex gap-2 items-start">
      {columns.map((matchups, colIdx) => {
        const roundNum = roundNumbers[colIdx];
        const gi = gapIndices[colIdx];
        const gap = GAPS[gi];
        const topPad = TOP_PADS[gi];

        return (
          <div key={`${side}-${colIdx}`} className="flex flex-col" style={{ minWidth: 220 }}>
            <div
              className="round-header text-xs font-bold mb-3 px-1 uppercase tracking-wider"
              style={{ color: "var(--text-dim)" }}
            >
              {ROUND_NAMES[roundNum]}
            </div>
            <div className="flex flex-col" style={{ gap, paddingTop: topPad }}>
              {matchups.map((matchup) => (
                <MatchupCard
                  key={matchup._id}
                  matchup={matchup}
                  participantSlug={participantSlug}
                  compact={roundNum < 4}
                  onClick={() => onMatchupClick(matchup)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
