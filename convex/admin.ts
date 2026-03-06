import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { determineWinnerId, getCurrentActiveRound, recordMatchupWinner } from "./tournament";

export const batchUpdateYoutubeUrls = mutation({
  args: {
    updates: v.array(
      v.object({
        slug: v.string(),
        youtubeUrl: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const character = await ctx.db
        .query("characters")
        .withIndex("by_slug", (q) => q.eq("slug", update.slug))
        .unique();
      if (character) {
        await ctx.db.patch(character._id, { youtubeUrl: update.youtubeUrl });
        updated++;
      }
    }
    return { success: true, updated };
  },
});

export const batchUpdateTaglines = mutation({
  args: {
    updates: v.array(
      v.object({
        slug: v.string(),
        tagline: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const update of args.updates) {
      const character = await ctx.db
        .query("characters")
        .withIndex("by_slug", (q) => q.eq("slug", update.slug))
        .unique();
      if (character) {
        await ctx.db.patch(character._id, { tagline: update.tagline });
        updated++;
      }
    }
    return { success: true, updated };
  },
});

export const finalizeCurrentRound = internalMutation({
  args: {
    round: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const targetRound = args.round ?? (await getCurrentActiveRound(ctx));
    if (!targetRound) {
      throw new Error("No active round found.");
    }

    const activeMatchups = (
      await ctx.db
        .query("matchups")
        .withIndex("by_round", (q) => q.eq("round", targetRound))
        .collect()
    )
      .filter((matchup) => matchup.status === "active")
      .sort((a, b) => a.position - b.position);

    if (activeMatchups.length === 0) {
      throw new Error(`Round ${targetRound} has no active matchups to finalize.`);
    }

    const finalized = [];
    let activatedNextRound = 0;

    for (const matchup of activeMatchups) {
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_matchup", (q) => q.eq("matchupId", matchup._id))
        .collect();

      const winnerId = await determineWinnerId(
        ctx,
        matchup,
        votes.map((vote) => vote.characterId)
      );

      if (!winnerId) {
        continue;
      }

      const { activatedNextRound: activated } = await recordMatchupWinner(
        ctx,
        matchup,
        winnerId
      );
      activatedNextRound += activated;

      const winner = await ctx.db.get(winnerId);
      const topVotes = votes.filter(
        (vote) => vote.characterId === matchup.topCharacterId
      ).length;
      const bottomVotes = votes.filter(
        (vote) => vote.characterId === matchup.bottomCharacterId
      ).length;

      finalized.push({
        matchupId: matchup._id,
        position: matchup.position,
        winnerId,
        winnerName: winner?.name ?? "Unknown",
        topVotes,
        bottomVotes,
        totalVotes: votes.length,
      });
    }

    return {
      success: true,
      finalizedRound: targetRound,
      finalizedCount: finalized.length,
      activatedNextRound,
      finalized,
    };
  },
});

export const removeParticipantVote = internalMutation({
  args: {
    matchupId: v.id("matchups"),
    participantSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("votes")
      .withIndex("by_matchup_participant", (q) =>
        q.eq("matchupId", args.matchupId).eq("participantSlug", args.participantSlug)
      )
      .unique();

    if (!vote) {
      return { success: true, removed: false };
    }

    await ctx.db.delete(vote._id);

    return { success: true, removed: true };
  },
});
