import { mutation } from "./_generated/server";
import { v } from "convex/values";

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

    // Count votes for each character
    const allVotes = await ctx.db
      .query("votes")
      .withIndex("by_matchup", (q) => q.eq("matchupId", args.matchupId))
      .collect();

    // Recount including the vote we just cast/updated
    const voteCounts = new Map<string, number>();
    for (const vote of allVotes) {
      // If this is the voter who just voted, use their new choice
      if (vote.participantSlug === args.participantSlug) {
        const count = voteCounts.get(args.characterId) || 0;
        voteCounts.set(args.characterId, count + 1);
      } else {
        const count = voteCounts.get(vote.characterId) || 0;
        voteCounts.set(vote.characterId, count + 1);
      }
    }

    // Check for majority (4 out of 6)
    const MAJORITY = 4;
    let winnerId: string | null = null;
    for (const [charId, count] of voteCounts) {
      if (count >= MAJORITY) {
        winnerId = charId;
        break;
      }
    }

    if (winnerId) {
      // Mark matchup as decided
      await ctx.db.patch(args.matchupId, {
        winnerId: winnerId as any,
        status: "decided",
      });

      // Advance winner to next round
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

          // Check if both slots are now filled → activate
          const updated = await ctx.db.get(nextMatchup._id);
          if (updated && updated.topCharacterId && updated.bottomCharacterId) {
            await ctx.db.patch(nextMatchup._id, { status: "active" });
          }
        }
      }
    }

    return { success: true };
  },
});
