import {
  CommandInteraction,
  MessageContextMenuCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from "discord.js";

type CommandTypes =
  | Command<CommandInteraction>
  | Command<MessageContextMenuCommandInteraction>;

interface Command<T> {
  data: T extends MessageContextMenuCommandInteraction
    ? RESTPostAPIContextMenuApplicationCommandsJSONBody
    : RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute: (interaction: T) => Promise<void>;
}
