import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
