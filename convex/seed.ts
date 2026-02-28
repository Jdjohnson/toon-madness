import { mutation } from "./_generated/server";

const CHARACTERS = [
  { seed: 1, name: "Bugs Bunny", show: "Looney Tunes", tagline: "Ain't I a stinker? The OG trickster who never loses his cool — or a carrot." },
  { seed: 2, name: "Batman", show: "Batman: TAS", tagline: "I am vengeance. I am the night. The definitive Dark Knight started right here." },
  { seed: 3, name: "Spider-Man", show: "Spider-Man: TAS", tagline: "With great power comes great Saturday mornings. The web-slinger who made every kid believe." },
  { seed: 4, name: "Goku", show: "Dragon Ball Z", tagline: "Power level? Over 9000. Spirit bombs, Super Saiyan screams, and the fight never ends." },
  { seed: 5, name: "Wolverine", show: "X-Men: TAS", tagline: "I'm the best there is at what I do. That opening guitar riff still hits different." },
  { seed: 6, name: "SpongeBob", show: "SpongeBob SquarePants", tagline: "I'm ready! Eternally optimistic fry cook who lives in a pineapple and rules Bikini Bottom." },
  { seed: 7, name: "Bart Simpson", show: "The Simpsons", tagline: "Eat my shorts. America's favorite underachiever since 1989." },
  { seed: 8, name: "Optimus Prime", show: "Transformers", tagline: "Autobots, roll out! The leader who taught a generation that freedom is the right of all." },
  { seed: 9, name: "Michelangelo", show: "TMNT", tagline: "Cowabunga, dude! The pizza-loving party turtle with nunchucks and zero chill." },
  { seed: 10, name: "He-Man", show: "Masters of the Universe", tagline: "By the power of Grayskull! The most powerful man in the universe — and he told you so." },
  { seed: 11, name: "Scooby-Doo", show: "Scooby-Doo", tagline: "Ruh-roh! A cowardly Great Dane who solves every mystery for the right Scooby Snack." },
  { seed: 12, name: "Darkwing Duck", show: "Darkwing Duck", tagline: "Let's get dangerous. The terror that flaps in the night — St. Canard's ego with a cape." },
  { seed: 13, name: "Dexter", show: "Dexter's Laboratory", tagline: "Dee Dee, get out of my laboratory! Boy genius vs. annoying sister — the eternal struggle." },
  { seed: 14, name: "Lion-O", show: "Thundercats", tagline: "Thunder, Thunder, ThunderCats — HOOOO! Sword of Omens, give him sight beyond sight." },
  { seed: 15, name: "Goliath", show: "Gargoyles", tagline: "We have protected this island for a thousand years. Stone by day, warriors by night." },
  { seed: 16, name: "Cartman", show: "South Park", tagline: "Respect my authoritah! The most terrible child on television — and somehow you can't look away." },
  { seed: 17, name: "Daffy Duck", show: "Looney Tunes", tagline: "You're dethpicable. The unhinged rival who's been chasing Bugs' spotlight since day one." },
  { seed: 18, name: "Tom", show: "Tom & Jerry", tagline: "The original cat-and-mouse game. Decades of pain, zero dialogue, peak physical comedy." },
  { seed: 19, name: "Courage", show: "Courage the Cowardly Dog", tagline: "The things I do for love! Terrified of everything but braver than anyone when it counts." },
  { seed: 20, name: "Donatello", show: "TMNT", tagline: "Does machines. The brains of the turtle operation — bo staff and a big brain." },
  { seed: 21, name: "Yakko", show: "Animaniacs", tagline: "Goodnight, everybody! The fast-talking Warner brother who can name every country in one song." },
  { seed: 22, name: "Brain", show: "Pinky and the Brain", tagline: "The same thing we do every night — try to take over the world. Genius-level megalomania." },
  { seed: 23, name: "Danny Phantom", show: "Danny Phantom", tagline: "Going ghost! Half-kid, half-phantom, full-time hero of Amity Park." },
  { seed: 24, name: "Hey Arnold", show: "Hey Arnold!", tagline: "Football head with a heart of gold. The kid who made inner-city block life feel like home." },
  { seed: 25, name: "Blossom", show: "Powerpuff Girls", tagline: "Commander and the leader! Sugar, spice, and Chemical X — Townsville's pink powerhouse." },
  { seed: 26, name: "Johnny Bravo", show: "Johnny Bravo", tagline: "Man, I'm pretty. All muscles, no game — the pompadour that launched a thousand rejections." },
  { seed: 27, name: "Doug Funnie", show: "Doug", tagline: "Dear journal... The most relatable kid on Nick, chronicling every awkward moment since '91." },
  { seed: 28, name: "Ed", show: "Ed, Edd n Eddy", tagline: "Buttered toast! Pure chaos in a jacket. The lovable oaf of the cul-de-sac." },
  { seed: 29, name: "Rocko", show: "Rocko's Modern Life", tagline: "That was a hoot! An Australian wallaby navigating the absurdity of modern American life." },
  { seed: 30, name: "Skeletor", show: "Masters of the Universe", tagline: "I'll be back! The skull-faced schemer who somehow became the internet's favorite villain meme." },
  { seed: 31, name: "The Tick", show: "The Tick", tagline: "Spoon! Nigh-invulnerable, completely clueless, and the purest superhero parody ever made." },
  { seed: 32, name: "Dagget", show: "Angry Beavers", tagline: "Spoot! The hyperactive beaver brother who turns everything into a catastrophe." },
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
        tagline: char.tagline,
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
