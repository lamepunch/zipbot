import {
  ChatInputCommandInteraction,
  CommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from "discord.js";

type CommandTypes =
  | Command<ChatInputCommandInteraction>
  | Command<MessageContextMenuCommandInteraction>;

interface Command<T> {
  data: T extends MessageContextMenuCommandInteraction
    ? RESTPostAPIContextMenuApplicationCommandsJSONBody
    : RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute: (interaction: T) => Promise<void>;
}

interface Extension {
  commands?: CommandTypes[];
  triggers?: ((message: Message) => Promise<unknown>)[];
}
