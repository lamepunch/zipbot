import {
  APIEmbedField,
  CommandInteraction,
  InteractionReplyOptions,
} from "discord.js";

import type { Command } from "../types.js";
import { RESPONSE_COLOR, LEADERBOARD_EMOJIS } from "../constants.js";

import prisma from "../prisma.js";
import log from "../logger.js";
import { getInvocationLeaderboard } from "../generated/prisma/sql.js";

const LeaderboardCommand: Command<CommandInteraction> = {
  data: {
    name: "leaderboard",
    description: "See who's the biggest and the baddest",
  },

  async execute(interaction) {
    // Fetch fresh counts from the DB
    let counts = await prisma.$queryRawTyped(getInvocationLeaderboard());

    log.debug(counts, "Fetched leaderboard counts from database");

    let entries: APIEmbedField[] = counts.map((row, position) => ({
      name: `${position + 1}. ${row.displayName}`,
      value: `${LEADERBOARD_EMOJIS[position]} ${row.count ?? 0n} total unzips`,
    }));

    let response: InteractionReplyOptions = {
      embeds: [
        {
          title: "Global Leaderboard",
          fields: entries,
          color: RESPONSE_COLOR,
        },
      ],
    };
    await interaction.reply(response);
  },
};

export default LeaderboardCommand;
