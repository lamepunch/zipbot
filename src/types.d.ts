import { CommandInteraction } from "@discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

interface LeaderboardEntry {
  position: number;
  username: string;
  invocations: number;
}
