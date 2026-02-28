import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBracket = query({
  args: {},
  handler: async (ctx) => {
    const matchups = await ctx.db.query("matchups").collect();

    const result = await Promise.all(
      matchups.map(async (matchup) => {
        const topCharacter = matchup.topCharacterId
          ? await ctx.db.get(matchup.topCharacterId)
          : null;
        const bottomCharacter = matchup.bottomCharacterId
          ? await ctx.db.get(matchup.bottomCharacterId)
          : null;
        const winner = matchup.winnerId
          ? await ctx.db.get(matchup.winnerId)
          : null;

        const votes = await ctx.db
          .query("votes")
          .withIndex("by_matchup", (q) => q.eq("matchupId", matchup._id))
          .collect();

        return {
          ...matchup,
          topCharacter,
          bottomCharacter,
          winner,
          votes: votes.map((v) => ({
            participantSlug: v.participantSlug,
            characterId: v.characterId,
          })),
        };
      })
    );

    // Sort by round then position
    result.sort((a, b) => a.round - b.round || a.position - b.position);

    return result;
  },
});

export const getParticipants = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("participants").collect();
  },
});

export const getMatchup = query({
  args: { matchupId: v.id("matchups") },
  handler: async (ctx, args) => {
    const matchup = await ctx.db.get(args.matchupId);
    if (!matchup) return null;

    const topCharacter = matchup.topCharacterId
      ? await ctx.db.get(matchup.topCharacterId)
      : null;
    const bottomCharacter = matchup.bottomCharacterId
      ? await ctx.db.get(matchup.bottomCharacterId)
      : null;
    const winner = matchup.winnerId
      ? await ctx.db.get(matchup.winnerId)
      : null;

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_matchup", (q) => q.eq("matchupId", matchup._id))
      .collect();

    return {
      ...matchup,
      topCharacter,
      bottomCharacter,
      winner,
      votes: votes.map((v) => ({
        participantSlug: v.participantSlug,
        characterId: v.characterId,
      })),
    };
  },
});
