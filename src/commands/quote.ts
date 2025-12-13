import { CommandInteraction, Snowflake } from "discord.js";

import { Command } from "../types.js";
import { QUOTE_EMBED_TITLES, RESPONSE_COLOR } from "../constants.js";
import prisma from "../prisma.js";

const constructMention = (emoji: string, id: Snowflake) => `${emoji} <@${id}>`;

const QuoteCommand: Command<CommandInteraction> = {
  data: {
    name: "quote",
    description: "Get a random quote",
  },

  async execute(interaction) {
    let quoteCount = await prisma.quote.count();

    let randomQuote = await prisma.quote.findRandom({
      include: {
        user: true,
        submitter: true,
        guild: true,
        channel: true,
      },
    });

    if (randomQuote) {
      let {
        id,
        messageId,
        createdAt,
        user,
        submitter,
        guild,
        channel,
        content,
      } = randomQuote;

      let randomTitle =
        QUOTE_EMBED_TITLES[Math.floor(Math.random() * QUOTE_EMBED_TITLES.length)];

      await interaction.reply({
        embeds: [
          {
            author: {
              name: randomTitle,
              icon_url:
                "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/thinking-face_1f914.png",
            },
            description: `${content}`,
            timestamp: createdAt.toISOString(),
            fields: [
              {
                name: "Wisdom Dispenser",
                value: constructMention("🧙", user.snowflakeId),
                inline: true,
              },
              {
                name: "Inscriptor of History",
                value: constructMention("🤠", submitter.snowflakeId),
                inline: true,
              },
              {
                name: "Permalink",
                value: `[➡️ View](https://discord.com/channels/${guild.snowflakeId}/${channel.snowflakeId}/${messageId})`,
              },
            ],
            footer: { text: `Quote #${id}` },
            color: RESPONSE_COLOR,
          },
        ],
      });
    } else {
      let errorMessage =
        "Unable to retrieve a random quote. Please try again later.";

      if (quoteCount === 0) {
        errorMessage =
          "There are no quotes in the database. Please submit a quote first.";
      }

      await interaction.reply({
        content: errorMessage,
        ephemeral: true,
      });
    }
  },
};

export default QuoteCommand;
