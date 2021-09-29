import { CommandInteraction, Message } from "@discord.js";

interface Command {
  data: any;
  execute: (
    interaction?: CommandInteraction,
    message?: Message
  ) => Promise<void>;
}

interface LeaderboardEntry {
  position: number;
  username: string;
  invocations: number;
}
