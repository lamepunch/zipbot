import {
  CommandInteraction,
  ContextMenuCommandInteraction,
  Message,
} from "discord.js";

type CommandTypes =
  | Command<Message>
  | Command<CommandInteraction>
  | Command<ContextMenuCommandInteraction>;

interface Command<T> {
  data: any;
  execute: (interaction: T) => Promise<void>;
}

interface LeaderboardEntry {
  position: number;
  username: string;
  invocations: number;
}
