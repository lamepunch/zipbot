import { MessageContextMenuCommandInteraction, MessageFlags } from "discord.js";

import type { Command } from "../types.js";

import prisma from "../prisma.js";
import recordOccurrences from "../triggers/words.js";

const BackfillCommand: Command<MessageContextMenuCommandInteraction> = {
  data: {
    name: "Backfill",
    type: 3,
    default_permission: false,
  },

  async execute(interaction) {
    let message = interaction.targetMessage;

    // Helper function to reply to the user with an ephemeral message
    let reply = async (content: string) =>
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });

    if (message.author.bot || message.guild === null) {
      await reply("This message can't be backfilled.");
      return;
    }

    let existing = await prisma.occurrence.findFirst({
      where: { messageId: message.id },
    });
    if (existing !== null) {
      await reply("Occurrences for this message have already been recorded.");
      return;
    }

    let matched = await recordOccurrences(message);
    if (matched.length > 0) {
      await reply(`Recorded occurrences for ${matched.length} tracked word(s).`);
    } else {
      await reply("No tracked words matched this message.");
    }
  },
};

export default BackfillCommand;
