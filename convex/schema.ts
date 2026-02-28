import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  characters: defineTable({
    name: v.string(),
    slug: v.string(),
    show: v.string(),
    seed: v.number(),
    youtubeUrl: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  })
    .index("by_seed", ["seed"])
    .index("by_slug", ["slug"]),

  participants: defineTable({
    name: v.string(),
    slug: v.string(),
    avatarUrl: v.optional(v.string()),
    description: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  matchups: defineTable({
    round: v.number(),
    position: v.number(),
    topCharacterId: v.optional(v.id("characters")),
    bottomCharacterId: v.optional(v.id("characters")),
    winnerId: v.optional(v.id("characters")),
    status: v.union(
      v.literal("locked"),
      v.literal("active"),
      v.literal("decided")
    ),
  })
    .index("by_round", ["round"])
    .index("by_round_position", ["round", "position"]),

  votes: defineTable({
    matchupId: v.id("matchups"),
    participantSlug: v.string(),
    characterId: v.id("characters"),
    createdAt: v.number(),
  })
    .index("by_matchup", ["matchupId"])
    .index("by_matchup_participant", ["matchupId", "participantSlug"]),
});
