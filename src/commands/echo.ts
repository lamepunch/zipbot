import { CommandInteraction } from "discord.js";

import type { Command } from "../types.js";
import log from "../logger.js";

const EchoCommand: Command<CommandInteraction> = {
  data: {
    name: "echo",
    description: "Echo a message back into the channel",
    options: [
      {
        name: "message",
        description: "Message to echo",
        type: 3,
        required: true,
      },
    ],
  },

  async execute(interaction) {
    // @ts-ignore
    let message = interaction.options.getString("message", true);
    let content = `<@${interaction.user.id}> said: ${message}`;

    log.info(
      {
        user: interaction.user.id,
        channel: interaction.channel?.id,
        message,
      },
      "Message to echo",
    );

    await interaction.reply({ content });
  },
};

export default EchoCommand;
