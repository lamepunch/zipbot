import {
  CommandInteraction,
  MessageContextMenuCommandInteraction,
  Message,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from "discord.js";

type CommandTypes =
  | Command<Message>
  | Command<CommandInteraction>
  | Command<MessageContextMenuCommandInteraction>;

interface Command<T> {
  data: T extends MessageContextMenuCommandInteraction
    ? RESTPostAPIContextMenuApplicationCommandsJSONBody
    : T extends Message
      ? { name: string; description: string }
      : RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute: (interaction: T) => Promise<void>;
}
