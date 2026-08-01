import { MessageFlags, type Interaction } from "discord.js";

import { formatError } from "../utils/helpers.js";

import log from "../logger.js";
import commands from "../commands/index.js";

export default async function interactionCreate(interaction: Interaction) {
  log.debug("interactionCreate event fired");

  if (
    interaction.isChatInputCommand() ||
    interaction.isMessageContextMenuCommand()
  ) {
    let { commandName } = interaction;
    let command = commands.get(commandName.toLowerCase());

    if (command) {
      let { name } = command.data;

      log.info(`Executing ${name} command`);

      try {
        await command.execute(interaction);
      } catch (error) {
        log.error(
          { error: formatError(error) },
          `Error executing ${name} command`,
        );

        await interaction.reply({
          content: "Command was unable to be executed. Please try again later.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } else {
      log.error(command, "Command was unable to be executed");

      await interaction.reply({
        content: "Command was unable to be executed. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
