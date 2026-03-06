import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { determineWinnerId, recordMatchupWinner } from "./tournament";

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

    const winnerId = await determineWinnerId(
      ctx,
      matchup,
      latestVotes.values() as Iterable<Id<"characters">>
    );

    if (!winnerId) return { success: true };

    const { activatedNextRound } = await recordMatchupWinner(ctx, matchup, winnerId);

    return { success: true, decided: true, winnerId, activatedNextRound };
  },
});
