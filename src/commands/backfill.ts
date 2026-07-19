import { MessageContextMenuCommandInteraction, MessageFlags } from "discord.js";

import type { Command } from "../types.js";

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

    let { matched, created } = await recordOccurrences(message);
    if (matched.length === 0) {
      await reply("No active tracked words matched this message.");
    } else if (created.length === 0) {
      await reply("Occurrences for this message have already been recorded.");
    } else {
      let plural = created.length === 1 ? "word" : "words";
      await reply(
        `Recorded occurrences for ${created.length} tracked ${plural}.`,
      );
    }
  },
};

export default BackfillCommand;
