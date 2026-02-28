import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const TOTAL_PARTICIPANTS = 6;

export const castVote = mutation({
  args: {
    matchupId: v.id("matchups"),
    participantSlug: v.string(),
    characterId: v.id("characters"),
  },
  handler: async (ctx, args) => {
    // Validate matchup is active
    const matchup = await ctx.db.get(args.matchupId);
    if (!matchup) throw new Error("Matchup not found");
    if (matchup.status !== "active") throw new Error("Matchup is not active");

    // Validate character is in this matchup
    if (
      args.characterId !== matchup.topCharacterId &&
      args.characterId !== matchup.bottomCharacterId
    ) {
      throw new Error("Character is not in this matchup");
    }

    // Validate participant exists
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_slug", (q) => q.eq("slug", args.participantSlug))
      .unique();
    if (!participant) throw new Error("Participant not found");

    // Check for existing vote (upsert)
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_matchup_participant", (q) =>
        q.eq("matchupId", args.matchupId).eq("participantSlug", args.participantSlug)
      )
      .unique();

    if (existingVote) {
      await ctx.db.patch(existingVote._id, {
        characterId: args.characterId,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert("votes", {
        matchupId: args.matchupId,
        participantSlug: args.participantSlug,
        characterId: args.characterId,
        createdAt: Date.now(),
      });
    }

    // Count votes for this matchup
    const allVotes = await ctx.db
      .query("votes")
      .withIndex("by_matchup", (q) => q.eq("matchupId", args.matchupId))
      .collect();

    // Build accurate vote map (account for the upsert we just did)
    const latestVotes = new Map<string, string>();
    for (const vote of allVotes) {
      if (vote.participantSlug === args.participantSlug) {
        latestVotes.set(vote.participantSlug, args.characterId);
      } else {
        latestVotes.set(vote.participantSlug, vote.characterId);
      }
    }

    // Not all participants have voted yet — wait
    if (latestVotes.size < TOTAL_PARTICIPANTS) {
      return { success: true, votesIn: latestVotes.size, totalNeeded: TOTAL_PARTICIPANTS };
    }

    // All 6 votes are in — determine winner by majority
    const voteCounts = new Map<string, number>();
    for (const charId of latestVotes.values()) {
      voteCounts.set(charId, (voteCounts.get(charId) || 0) + 1);
    }

    // Find winner (most votes). On tie, higher seed (lower number) wins.
    let winnerId: string | null = null;
    let winnerVotes = 0;
    let winnerSeed = Infinity;

    for (const [charId, count] of voteCounts) {
      const char = await ctx.db.get(charId as Id<"characters">);
      const seed = char?.seed ?? Infinity;

      if (count > winnerVotes || (count === winnerVotes && seed < winnerSeed)) {
        winnerId = charId;
        winnerVotes = count;
        winnerSeed = seed;
      }
    }

    if (!winnerId) return { success: true };

    // Mark matchup as decided
    await ctx.db.patch(args.matchupId, {
      winnerId: winnerId as any,
      status: "decided",
    });

    // Advance winner to next round slot
    if (matchup.round < 5) {
      const nextRound = matchup.round + 1;
      const nextPosition = Math.floor(matchup.position / 2);
      const isTopSlot = matchup.position % 2 === 0;

      const nextMatchup = await ctx.db
        .query("matchups")
        .withIndex("by_round_position", (q) =>
          q.eq("round", nextRound).eq("position", nextPosition)
        )
        .unique();

      if (nextMatchup) {
        const patch: Record<string, any> = {};
        if (isTopSlot) {
          patch.topCharacterId = winnerId;
        } else {
          patch.bottomCharacterId = winnerId;
        }
        await ctx.db.patch(nextMatchup._id, patch);
      }

      // Check if ALL matchups in this round are now decided
      const roundMatchups = await ctx.db
        .query("matchups")
        .withIndex("by_round", (q) => q.eq("round", matchup.round))
        .collect();

      const allDecided = roundMatchups.every((m) => m.status === "decided");

      if (allDecided) {
        // Activate all next-round matchups that have both slots filled
        const nextRoundMatchups = await ctx.db
          .query("matchups")
          .withIndex("by_round", (q) => q.eq("round", nextRound))
          .collect();

        for (const nm of nextRoundMatchups) {
          // Re-read to get latest state (we may have just patched character slots)
          const fresh = await ctx.db.get(nm._id);
          if (fresh && fresh.topCharacterId && fresh.bottomCharacterId && fresh.status === "locked") {
            await ctx.db.patch(nm._id, { status: "active" });
          }
        }
      }
    }

    return { success: true, decided: true, winnerId };
  },
});
