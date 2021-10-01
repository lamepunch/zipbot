import random from "random";
import { CommandInteraction, Snowflake } from "discord.js";

import { Command } from "../types";
import { QUOTE_EMBED_TITLES } from "../constants";
import prisma from "../prisma";

const mention = (id: Snowflake) => `<@${id}>`;

const QuoteCommand: Command<CommandInteraction> = {
  data: {
    name: "quote",
    description: "Get a random quote",
  },

  async execute(data) {
    let quoteCount = await prisma.quote.count();
    let quoteId = random.int(1, quoteCount);

    let randomQuote = await prisma.quote.findFirst({
      where: { id: quoteId },
    });

    if (randomQuote) {
      let {
        id,
        messageId,
        createdAt,
        userId,
        submitterId,
        guildId,
        channelId,
        content,
      } = randomQuote;

      let randomTitle =
        QUOTE_EMBED_TITLES[random.int(0, QUOTE_EMBED_TITLES.length - 1)];

      await data.reply({
        embeds: [
          {
            title: randomTitle,
            description: `>>> ${content}`,
            timestamp: createdAt,
            fields: [
              {
                name: "Wisdom dispenser",
                value: mention(userId),
                inline: true,
              },
              {
                name: "Inscriptor of history",
                value: mention(submitterId),
                inline: true,
              },
              {
                name: "Permalink",
                value: `[View message](https://discord.com/channels/${guildId}/${channelId}/${messageId})`,
                inline: true,
              },
            ],
            footer: {
              text: `Quote #${id}`,
            },
          },
        ],
      });
    } else {
      await data.reply({
        content: "Unable to retrieve a random quote. Please try again later.",
        ephemeral: true,
      });
    }
  },
};

export default QuoteCommand;
