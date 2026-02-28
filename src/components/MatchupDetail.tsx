"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import type { MatchupData, Character } from "@/components/MatchupCard";
import { useEffect } from "react";

interface MatchupDetailProps {
  matchup: MatchupData;
  participantSlug: string;
  onClose: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  positionLabel?: string;
}

export default function MatchupDetail({ matchup, participantSlug, onClose, onPrev, onNext, positionLabel }: MatchupDetailProps) {
  const castVote = useMutation(api.votes.castVote);

  const isActive = matchup.status === "active";
  const isDecided = matchup.status === "decided";
  const myVote = matchup.votes.find((v) => v.participantSlug === participantSlug);
  const totalVoters = 6;
  const uniqueVoters = new Set(matchup.votes.map((v) => v.participantSlug)).size;

  // Keyboard: Escape to close, arrows to navigate
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  // Prevent body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleVote(characterId: Id<"characters">) {
    if (!isActive) return;
    await castVote({ matchupId: matchup._id, participantSlug, characterId });
  }

  function renderPanel(character: Character | null, side: "left" | "right") {
    if (!character) {
      return (
        <div className={`detail-panel ${side}`}>
          <div className="detail-avatar-wrap">
            <div className="detail-avatar placeholder" />
          </div>
          <div className="detail-name">TBD</div>
        </div>
      );
    }

    const isWinner = isDecided && matchup.winner?._id === character._id;
    const isLoser = isDecided && matchup.winner?._id !== character._id;
    const isMyVote = myVote?.characterId === character._id;
    const votesForChar = matchup.votes.filter((v) => v.characterId === character._id);

    const panelClasses = [
      "detail-panel",
      side,
      isWinner ? "winner" : "",
      isLoser ? "loser" : "",
    ].filter(Boolean).join(" ");

    return (
      <div className={panelClasses}>
        <div className="detail-seed">{character.seed}</div>
        <div className="detail-avatar-wrap">
          <img
            className="detail-avatar"
            src={character.avatarUrl || `/characters/${character.slug}.png`}
            alt={character.name}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.background = "var(--bg-surface)";
              el.src = "";
            }}
          />
        </div>
        <div className="detail-name">{character.name}</div>
        <div className="detail-show">{character.show}</div>
        {character.tagline && (
          <div className="detail-tagline">{character.tagline}</div>
        )}

        {/* Vote dots */}
        {votesForChar.length > 0 && (
          <div className="detail-voters">
            {votesForChar.map((v) => (
              <img
                key={v.participantSlug}
                className="detail-voter-dot"
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

        {/* Vote button */}
        {isActive && (
          <button
            className={`detail-vote-btn ${isMyVote ? "voted" : ""}`}
            onClick={() => handleVote(character._id)}
          >
            {isMyVote ? "VOTED" : "VOTE"}
          </button>
        )}

        {isWinner && (
          <div className="detail-winner-badge">WINNER</div>
        )}
      </div>
    );
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-container" onClick={(e) => e.stopPropagation()}>
        {/* Top bar: close + position + progress */}
        <div className="detail-topbar">
          <button className="detail-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {positionLabel && (
            <span className="detail-position-label">{positionLabel}</span>
          )}
          {isActive && (
            <div className="detail-progress">
              <div className="detail-progress-bar">
                <div className="detail-progress-fill" style={{ width: `${(uniqueVoters / totalVoters) * 100}%` }} />
              </div>
              <span className="detail-progress-text">{uniqueVoters}/{totalVoters} voted</span>
            </div>
          )}
        </div>

        {/* Prev/Next arrows */}
        {onPrev && (
          <button className="detail-nav detail-nav-prev" onClick={onPrev}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {onNext && (
          <button className="detail-nav detail-nav-next" onClick={onNext}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        )}

        {/* Arena */}
        <div className="detail-arena">
          {renderPanel(matchup.topCharacter, "left")}
          <div className="detail-vs">VS</div>
          {renderPanel(matchup.bottomCharacter, "right")}
        </div>

        {/* Mobile bottom nav bar */}
        <div className="detail-bottom-nav">
          <button
            className="detail-bottom-nav-btn"
            onClick={onPrev ?? undefined}
            disabled={!onPrev}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {positionLabel && (
            <span className="detail-bottom-nav-label">{positionLabel}</span>
          )}
          <button
            className="detail-bottom-nav-btn"
            onClick={onNext ?? undefined}
            disabled={!onNext}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
