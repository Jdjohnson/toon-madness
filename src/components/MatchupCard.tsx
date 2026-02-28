"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface Character {
  _id: Id<"characters">;
  name: string;
  slug: string;
  show: string;
  seed: number;
  youtubeUrl?: string;
  avatarUrl?: string;
}

interface Vote {
  participantSlug: string;
  characterId: Id<"characters">;
}

interface MatchupData {
  _id: Id<"matchups">;
  round: number;
  position: number;
  status: "locked" | "active" | "decided";
  topCharacter: Character | null;
  bottomCharacter: Character | null;
  winner: Character | null;
  votes: Vote[];
}

interface MatchupCardProps {
  matchup: MatchupData;
  participantSlug: string;
  compact?: boolean;
}

export default function MatchupCard({ matchup, participantSlug, compact }: MatchupCardProps) {
  const castVote = useMutation(api.votes.castVote);

  const isActive = matchup.status === "active";
  const isDecided = matchup.status === "decided";
  const isLocked = matchup.status === "locked";

  const myVote = matchup.votes.find((v) => v.participantSlug === participantSlug);

  async function handleVote(characterId: Id<"characters">) {
    if (!isActive) return;
    await castVote({
      matchupId: matchup._id,
      participantSlug,
      characterId,
    });
  }

  function renderCharRow(character: Character | null, side: "top" | "bottom") {
    if (!character) {
      return (
        <div className="char-row" style={{ minHeight: compact ? 40 : 48 }}>
          <div className="seed-badge">?</div>
          <span style={{ color: "var(--text-dim)", fontSize: compact ? 12 : 14 }}>TBD</span>
        </div>
      );
    }

    const isWinner = isDecided && matchup.winner?._id === character._id;
    const isLoser = isDecided && matchup.winner?._id !== character._id;
    const isMyVote = myVote?.characterId === character._id;
    const votesForChar = matchup.votes.filter((v) => v.characterId === character._id);

    const classes = [
      "char-row",
      isActive ? "voteable" : "",
      isWinner ? "winner" : "",
      isLoser ? "loser" : "",
      isMyVote && isActive ? "voted" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className={classes}
        onClick={() => isActive && handleVote(character._id)}
        style={{ minHeight: compact ? 40 : 48 }}
      >
        <div className="seed-badge">{character.seed}</div>
        <img
          className="char-avatar"
          src={character.avatarUrl || `/characters/${character.slug}.png`}
          alt={character.name}
          style={compact ? { width: 28, height: 28 } : undefined}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.background = "var(--bg-surface)";
            el.src = "";
          }}
        />
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold truncate"
            style={{ fontSize: compact ? 12 : 14 }}
          >
            {character.name}
          </div>
          {!compact && (
            <div className="text-xs truncate" style={{ color: "var(--text-dim)" }}>
              {character.show}
            </div>
          )}
        </div>
        {character.youtubeUrl && (
          <a
            href={character.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="yt-icon"
            onClick={(e) => e.stopPropagation()}
            title="Watch clip"
          >
            <svg viewBox="0 0 24 24" fill="var(--red)" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        )}
        {votesForChar.length > 0 && (
          <div className="vote-dots">
            {votesForChar.map((v) => (
              <img
                key={v.participantSlug}
                className="vote-dot"
                src={`/participants/${v.participantSlug}.png`}
                alt={v.participantSlug}
                title={v.participantSlug}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.background = "var(--accent)";
                  el.src = "";
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`matchup-card ${matchup.status}`}>
      {renderCharRow(matchup.topCharacter, "top")}
      {renderCharRow(matchup.bottomCharacter, "bottom")}
    </div>
  );
}
