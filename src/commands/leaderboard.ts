import {
  APIEmbedField,
  CommandInteraction,
  InteractionReplyOptions,
  MessageFlags,
} from "discord.js";

import { Command, LeaderboardEntry } from "../types.js";
import { RESPONSE_COLOR, LEADERBOARD_EMOJIS } from "../constants.js";
import prisma from "../prisma.js";

const THIRTY_MINUTES_IN_MILLISECONDS = 1800000;

let cachedLeaderboard: LeaderboardEntry[] = [];
let lastCountFetch: Date | null = null;

function determineCacheState(interaction: CommandInteraction): boolean {
  if (lastCountFetch === null) {
    return true;
  } else {
    let invokedAt = lastCountFetch.getTime();
    let messageTime = interaction.createdAt.getTime();
    let cooldownDelta = invokedAt - messageTime;

    return cooldownDelta > THIRTY_MINUTES_IN_MILLISECONDS;
  }
}

async function sendMessage(
  interaction: CommandInteraction,
  data: LeaderboardEntry[],
) {
  // Convert the leaderboard data into an embed
  let entries: APIEmbedField[] = data.map(
    ({ position, username, invocations }: LeaderboardEntry) => ({
      name: `${position}. ${username}`,
      value: `${LEADERBOARD_EMOJIS[position - 1]} ${invocations} total unzips`,
    }),
  );

  let response: InteractionReplyOptions = {
    embeds: [
      {
        title: "Global Leaderboard",
        fields: entries,
        color: RESPONSE_COLOR,
        footer: { text: "⏱️ Updated every 30 minutes" },
      },
    ],
  };

  await interaction.reply(response);
}

const LeaderboardCommand: Command<CommandInteraction> = {
  data: {
    name: "leaderboard",
    description: "See who's the biggest and the baddest",
  },

  async execute(interaction) {
    // Take fresh or cached leaderboard data and send it to the user

    let isCacheStale = determineCacheState(interaction);
    if (isCacheStale) {
      // Cache is stale, fetch invocation counts from the database
      let counts = await prisma.user.findMany({
        take: 5,
        orderBy: { invocations: { _count: "desc" } },
        include: { _count: true },
      });

      // Convert the results into an intermediate data structure
      // @TODO: Convert this to a TypedSQL query
      let leaderboard: LeaderboardEntry[] = counts.map((user, index) => ({
        position: index + 1,
        username: user.displayName,
        invocations: user._count !== null ? user._count.invocations : 0,
      }));

      // Cache the leaderboard
      cachedLeaderboard = leaderboard;
      lastCountFetch = new Date();

      // Send to the user
      await sendMessage(interaction, leaderboard);
    } else {
      // We have a cached leaderboard, send it to the user
      await sendMessage(interaction, cachedLeaderboard);
    }
  },
};

export default LeaderboardCommand;
