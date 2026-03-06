import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

export async function determineWinnerId(
  ctx: MutationCtx,
  matchup: Doc<"matchups">,
  votes: Iterable<Id<"characters">>
): Promise<Id<"characters"> | null> {
  const candidateIds = [
    matchup.topCharacterId,
    matchup.bottomCharacterId,
  ].filter(Boolean) as Id<"characters">[];

  if (candidateIds.length === 0) {
    return null;
  }

  if (candidateIds.length === 1) {
    return candidateIds[0];
  }

  const voteCounts = new Map<Id<"characters">, number>();
  for (const candidateId of candidateIds) {
    voteCounts.set(candidateId, 0);
  }

  for (const characterId of votes) {
    if (voteCounts.has(characterId)) {
      voteCounts.set(characterId, (voteCounts.get(characterId) ?? 0) + 1);
    }
  }

  let winnerId = candidateIds[0];
  let winnerVotes = -1;
  let winnerSeed = Number.POSITIVE_INFINITY;

  for (const candidateId of candidateIds) {
    const character = await ctx.db.get(candidateId);
    const seed = character?.seed ?? Number.POSITIVE_INFINITY;
    const count = voteCounts.get(candidateId) ?? 0;

    if (count > winnerVotes || (count === winnerVotes && seed < winnerSeed)) {
      winnerId = candidateId;
      winnerVotes = count;
      winnerSeed = seed;
    }
  }

  return winnerId;
}

export async function recordMatchupWinner(
  ctx: MutationCtx,
  matchup: Doc<"matchups">,
  winnerId: Id<"characters"> | null
) {
  if (!winnerId) {
    return { activatedNextRound: 0 };
  }

  await ctx.db.patch(matchup._id, {
    winnerId,
    status: "decided",
  });

  if (matchup.round >= 5) {
    return { activatedNextRound: 0 };
  }

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
    await ctx.db.patch(nextMatchup._id, {
      [isTopSlot ? "topCharacterId" : "bottomCharacterId"]: winnerId,
    });
  }

  const roundMatchups = await ctx.db
    .query("matchups")
    .withIndex("by_round", (q) => q.eq("round", matchup.round))
    .collect();

  if (!roundMatchups.every((entry) => entry.status === "decided")) {
    return { activatedNextRound: 0 };
  }

  return { activatedNextRound: await activateReadyMatchups(ctx, nextRound) };
}

export async function activateReadyMatchups(ctx: MutationCtx, round: number) {
  const nextRoundMatchups = await ctx.db
    .query("matchups")
    .withIndex("by_round", (q) => q.eq("round", round))
    .collect();

  let activated = 0;

  for (const matchup of nextRoundMatchups) {
    const fresh = await ctx.db.get(matchup._id);
    if (!fresh) {
      continue;
    }

    if (
      fresh.status === "locked" &&
      fresh.topCharacterId &&
      fresh.bottomCharacterId
    ) {
      await ctx.db.patch(fresh._id, { status: "active" });
      activated += 1;
    }
  }

  return activated;
}

export async function getCurrentActiveRound(ctx: MutationCtx) {
  const matchups = await ctx.db.query("matchups").collect();
  const activeRounds = Array.from(
    new Set(matchups.filter((m) => m.status === "active").map((m) => m.round))
  ).sort((a, b) => a - b);

  return activeRounds[0] ?? null;
}
