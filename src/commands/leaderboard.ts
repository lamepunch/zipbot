import prisma from "../prisma";
import { MessageEmbed, EmbedFieldData, CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

interface LeaderboardEntry {
  position: number;
  username: string;
  invocations: number;
}

const THIRTY_MINUTES_IN_MILLISECONDS = 1800000;

let cachedLeaderboard: LeaderboardEntry[] = [];
let lastCountFetch: Date | null = null;

function determineCacheState(interaction: CommandInteraction): boolean {
  if (lastCountFetch === null) {
    return true;
  } else {
    let invokedAt = lastCountFetch.getTime();
    let messageTime = interaction.createdAt.getTime();
    let cooldownDelta = invokedAt - messageTime;

    return cooldownDelta > THIRTY_MINUTES_IN_MILLISECONDS;
  }
}

function constructEmbed(data: LeaderboardEntry[]): MessageEmbed {
  // Convert the leaderboard data into an embed
  let entries: EmbedFieldData[] = data.map(
    ({ position, username, invocations }: LeaderboardEntry) => ({
      name: `${position}. ${username}`,
      value: `${invocations} total unzips`,
    })
  );

  let response: MessageEmbed = new MessageEmbed()
    .setTitle("Leaderboard")
    .addFields(entries)
    .setFooter("Updated every 30 minutes");

  return response;
}

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("See who's the biggest and the baddest"),
  async execute(interaction: CommandInteraction) {
    async function sendMessage(data: LeaderboardEntry[]) {
      let response = constructEmbed(data);
      await interaction.reply({ ephemeral: true });
    }

    let isCacheStale = determineCacheState(interaction);
    if (isCacheStale) {
      // Cache is stale, fetch invocation counts from the database,
      let counts = await prisma.user.findMany({
        take: 5,
        orderBy: { invocations: { count: "desc" } },
        include: { _count: true },
      });

      // Convert the results into an intermediate data structure
      let leaderboard: LeaderboardEntry[] = counts.map((user, index) => ({
        position: index + 1,
        username: user.name,
        invocations: user._count !== null ? user._count.invocations : 0,
      }));

      console.log("Caching leaderboard!");
      // Cache the leaderboard
      cachedLeaderboard = leaderboard;
      lastCountFetch = new Date();

      // Construct the embed and send it to the channel
      await sendMessage(leaderboard);
    } else {
      console.log("Retrieving cached leaderboard!");
      await sendMessage(cachedLeaderboard);
    }
  },
};
