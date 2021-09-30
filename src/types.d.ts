import {
  CommandInteraction,
  ContextMenuInteraction,
  Message,
} from "discord.js";

type CommandTypes =
  | Command<Message>
  | Command<CommandInteraction>
  | Command<ContextMenuInteraction>;

interface Command<T> {
  data: any;
  execute: (response: T) => Promise<void>;
}

interface LeaderboardEntry {
  position: number;
  username: string;
  invocations: number;
}
