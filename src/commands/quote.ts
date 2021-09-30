import { CommandInteraction } from "discord.js";

import { Command } from "../types";
import prisma from "../prisma";

const QuoteCommand: Command<CommandInteraction> = {
  data: {
    name: "quote",
    description: "Get a random quote",
  },

  async execute(data) {
    let quoteCount = await prisma.quote.count();
    let quoteId = Math.floor(Math.random() * (quoteCount - 1)) + 1;

    let randomQuote = await prisma.quote.findFirst({
      where: { id: quoteId },
      include: { user: true },
    });

    if (randomQuote) {
      let { id, createdAt, user, content } = randomQuote;
      await data.reply({
        embeds: [
          {
            author: { name: user.name },
            description: `>>> ${content}`,
            timestamp: createdAt,
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
