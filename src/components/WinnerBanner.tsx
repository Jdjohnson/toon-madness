"use client";

import { useEffect, useState } from "react";

interface WinnerBannerProps {
  characterName: string;
  characterShow: string;
  avatarUrl?: string;
}

const CONFETTI_COLORS = ["#f97316", "#22c55e", "#fbbf24", "#ef4444", "#3b82f6", "#a855f7"];

export default function WinnerBanner({ characterName, characterShow, avatarUrl }: WinnerBannerProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; color: string; delay: number; size: number }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 2,
      size: 6 + Math.random() * 10,
    }));
    setPieces(generated);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
      <div className="text-center z-10">
        <div className="text-2xl font-bold mb-4" style={{ color: "var(--gold)" }}>
          CHAMPION
        </div>
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={characterName}
            className="w-32 h-32 rounded-2xl mx-auto mb-4 object-cover"
            style={{ border: "3px solid var(--gold)" }}
          />
        )}
        <div className="text-4xl md:text-6xl font-black text-white mb-2">
          {characterName}
        </div>
        <div className="text-lg" style={{ color: "var(--text-dim)" }}>
          {characterShow}
        </div>
      </div>
    </div>
  );
}
