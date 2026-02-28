import { mutation } from "./_generated/server";

const CHARACTERS = [
  { seed: 1, name: "Bugs Bunny", show: "Looney Tunes" },
  { seed: 2, name: "Batman", show: "Batman: TAS" },
  { seed: 3, name: "Spider-Man", show: "Spider-Man: TAS" },
  { seed: 4, name: "Goku", show: "Dragon Ball Z" },
  { seed: 5, name: "Wolverine", show: "X-Men: TAS" },
  { seed: 6, name: "SpongeBob", show: "SpongeBob SquarePants" },
  { seed: 7, name: "Bart Simpson", show: "The Simpsons" },
  { seed: 8, name: "Optimus Prime", show: "Transformers" },
  { seed: 9, name: "Michelangelo", show: "TMNT" },
  { seed: 10, name: "He-Man", show: "Masters of the Universe" },
  { seed: 11, name: "Scooby-Doo", show: "Scooby-Doo" },
  { seed: 12, name: "Darkwing Duck", show: "Darkwing Duck" },
  { seed: 13, name: "Dexter", show: "Dexter's Laboratory" },
  { seed: 14, name: "Lion-O", show: "Thundercats" },
  { seed: 15, name: "Goliath", show: "Gargoyles" },
  { seed: 16, name: "Cartman", show: "South Park" },
  { seed: 17, name: "Daffy Duck", show: "Looney Tunes" },
  { seed: 18, name: "Tom", show: "Tom & Jerry" },
  { seed: 19, name: "Courage", show: "Courage the Cowardly Dog" },
  { seed: 20, name: "Donatello", show: "TMNT" },
  { seed: 21, name: "Yakko", show: "Animaniacs" },
  { seed: 22, name: "Brain", show: "Pinky and the Brain" },
  { seed: 23, name: "Danny Phantom", show: "Danny Phantom" },
  { seed: 24, name: "Hey Arnold", show: "Hey Arnold!" },
  { seed: 25, name: "Blossom", show: "Powerpuff Girls" },
  { seed: 26, name: "Johnny Bravo", show: "Johnny Bravo" },
  { seed: 27, name: "Doug Funnie", show: "Doug" },
  { seed: 28, name: "Ed", show: "Ed, Edd n Eddy" },
  { seed: 29, name: "Rocko", show: "Rocko's Modern Life" },
  { seed: 30, name: "Skeletor", show: "Masters of the Universe" },
  { seed: 31, name: "The Tick", show: "The Tick" },
  { seed: 32, name: "Dagget", show: "Angry Beavers" },
];

const PARTICIPANTS = [
  { name: "Jarsh", slug: "jarsh" },
  { name: "Morgan", slug: "morgan" },
  { name: "Joey", slug: "joey" },
  { name: "Josh", slug: "josh" },
  { name: "David", slug: "david" },
  { name: "Jarad", slug: "jarad" },
];

// Standard March Madness bracket seeding for 32 teams
// [topSeed, bottomSeed] for each of the 16 Round 1 positions
const BRACKET_SEEDS: [number, number][] = [
  [1, 32], [16, 17], [8, 25], [9, 24],
  [4, 29], [13, 20], [5, 28], [12, 21],
  [2, 31], [15, 18], [7, 26], [10, 23],
  [3, 30], [14, 19], [6, 27], [11, 22],
];

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const initBracket = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("characters").first();
    if (existing) {
      throw new Error("Bracket already seeded. Use resetBracket first.");
    }

    // Insert characters
    const seedToId = new Map<number, string>();
    for (const char of CHARACTERS) {
      const id = await ctx.db.insert("characters", {
        name: char.name,
        slug: toSlug(char.name),
        show: char.show,
        seed: char.seed,
        avatarUrl: `/characters/${toSlug(char.name)}.png`,
      });
      seedToId.set(char.seed, id);
    }

    // Insert participants
    for (const p of PARTICIPANTS) {
      await ctx.db.insert("participants", {
        name: p.name,
        slug: p.slug,
        avatarUrl: `/participants/${p.slug}.png`,
      });
    }

    // Create Round 1 matchups (16 active matchups)
    for (let pos = 0; pos < 16; pos++) {
      const [topSeed, bottomSeed] = BRACKET_SEEDS[pos];
      await ctx.db.insert("matchups", {
        round: 1,
        position: pos,
        topCharacterId: seedToId.get(topSeed)! as any,
        bottomCharacterId: seedToId.get(bottomSeed)! as any,
        status: "active",
      });
    }

    // Create Round 2 matchups (8 locked)
    for (let pos = 0; pos < 8; pos++) {
      await ctx.db.insert("matchups", {
        round: 2,
        position: pos,
        status: "locked",
      });
    }

    // Create Round 3 matchups (4 locked)
    for (let pos = 0; pos < 4; pos++) {
      await ctx.db.insert("matchups", {
        round: 3,
        position: pos,
        status: "locked",
      });
    }

    // Create Round 4 matchups (2 locked)
    for (let pos = 0; pos < 2; pos++) {
      await ctx.db.insert("matchups", {
        round: 4,
        position: pos,
        status: "locked",
      });
    }

    // Create Championship matchup (1 locked)
    await ctx.db.insert("matchups", {
      round: 5,
      position: 0,
      status: "locked",
    });

    return { success: true, characters: 32, participants: 6, matchups: 31 };
  },
});

export const resetBracket = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all votes
    const votes = await ctx.db.query("votes").collect();
    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete all matchups
    const matchups = await ctx.db.query("matchups").collect();
    for (const matchup of matchups) {
      await ctx.db.delete(matchup._id);
    }

    // Delete all participants
    const participants = await ctx.db.query("participants").collect();
    for (const p of participants) {
      await ctx.db.delete(p._id);
    }

    // Delete all characters
    const characters = await ctx.db.query("characters").collect();
    for (const char of characters) {
      await ctx.db.delete(char._id);
    }

    return { success: true, message: "Bracket reset. Run initBracket to re-seed." };
  },
});
