import {
  APIEmbedField,
  CommandInteraction,
  InteractionReplyOptions,
} from "discord.js";

import { Command, LeaderboardEntry } from "../types.js";
import { RESPONSE_COLOR, LEADERBOARD_EMOJIS } from "../constants.js";
import prisma from "../prisma.js";
import log from "../logger.js";

const THIRTY_MINUTES_IN_MILLISECONDS = 1800000;

let cachedLeaderboard: LeaderboardEntry[] = [];
let lastCountFetch: Date | null = null;

function determineCacheState(interaction: CommandInteraction): boolean {
  log.debug("determineCacheState function invoked");

  if (lastCountFetch === null) {
    log.info("No leaderboard data is cached");
    return true;
  } else {
    log.info("Previous leaderboard fetch found, checking staleness");

    let invokedAt = lastCountFetch.getTime();
    let messageTime = interaction.createdAt.getTime();
    let cooldownDelta = invokedAt - messageTime;
    let isStale = cooldownDelta > THIRTY_MINUTES_IN_MILLISECONDS;

    log.debug(
      { invokedAt, messageTime, cooldownDelta, isStale },
      "Leaderboard cache details",
    );

    log.info(isStale, "Leaderboard cache staleness determined");
    return isStale;
  }
}

async function sendMessage(
  interaction: CommandInteraction,
  data: LeaderboardEntry[],
) {
  log.debug(data, "sendMessage function invoked");

  // Convert the leaderboard data into an embed
  let entries: APIEmbedField[] = data.map(
    ({ position, username, invocations }: LeaderboardEntry) => ({
      name: `${position}. ${username}`,
      value: `${LEADERBOARD_EMOJIS[position - 1]} ${invocations} total unzips`,
    }),
  );

  log.debug(entries, "Converted leaderboard data for Discord embed");

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

  log.debug(response, "Interaction reply constructed");

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
      log.info("Fetching fresh data");

      // Cache is stale, fetch invocation counts from the database
      // @TODO: Convert this to a TypedSQL query

      let counts = await prisma.user.findMany({
        take: 5,
        orderBy: { invocations: { _count: "desc" } },
        include: { _count: true },
      });

      log.debug(counts, "Fetched leaderboard counts from database");

      // Convert the results into an intermediate data structure
      let leaderboard: LeaderboardEntry[] = counts.map(
        (user, index: number) => ({
          position: index + 1,
          username: user.displayName,
          invocations: user._count !== null ? user._count.invocations : 0,
        }),
      );

      log.debug(leaderboard, "Created leaderboard data");

      // Cache the leaderboard
      cachedLeaderboard = leaderboard;
      lastCountFetch = new Date();

      log.debug(
        { lastCountFetch, leaderboard },
        "Updated leaderboard cache with new values",
      );

      // Send to the user
      log.info("Sending message with fresh leaderboard data");
      await sendMessage(interaction, leaderboard);
    } else {
      // We have a cached leaderboard, send it to the user
      log.info("Sending message with cached leaderboard data");
      await sendMessage(interaction, cachedLeaderboard);
    }
  },
};

export default LeaderboardCommand;
