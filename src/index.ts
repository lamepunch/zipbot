import {
  Client,
  EmbedFieldData,
  Guild,
  Message,
  MessageEmbed,
} from "discord.js";
import { PrismaClient, Server } from "@prisma/client";

import reactions from "./reactions";

let prisma: PrismaClient = new PrismaClient();
let client: Client = new Client();

let cachedLeaderboard: LeaderboardEntry[] = [];
let lastCountFetch: Date | null = null;

interface LeaderboardEntry {
  position: number;
  username: string;
  invocations: number;
}

client.on("guildCreate", async (guild: Guild) => {
  // Whenever Zipbot joins a new server, create a server
  // entry in the database
  let createServer: Server = await prisma.server.create({
    data: {
      id: guild.id,
      name: guild.name,
    },
  });
});

client.on("message", async (message: Message) => {
  let isValidMessage: boolean =
    message.content.match(/unzip/i) !== null &&
    message.author.bot === false &&
    message.channel.type === "text" &&
    message.guild !== null;

  if (isValidMessage) {
    let createInvocation = await prisma.invocation.create({
      data: {
        user: {
          connectOrCreate: {
            create: {
              name: message.author.username,
              id: message.author.id,
            },
            where: {
              id: message.author.id,
            },
          },
        },
        server: {
          connect: { id: message?.guild?.id },
        },
        channel: {
          connectOrCreate: {
            create: {
              id: message.channel.id,
              // @ts-ignore
              name: message.channel.name,
              server: { connect: { id: message?.guild?.id } },
            },
            where: {
              id: message.channel.id,
            },
          },
        },
      },
    });

    let invocationCount = createInvocation.id;

    if (createInvocation) {
      let randomImage: string =
        reactions[Math.floor(Math.random() * reactions.length)];

      let response: MessageEmbed = new MessageEmbed()
        .setImage(randomImage)
        .setFooter(`#${invocationCount}`);

      message.channel.send(`${message.author} unzipped:`, response);
    }
  }

  if (message.content === "!leaderboard") {
    const THIRTY_MINUTES_IN_MILLISECONDS = 1800000;

    function determineCacheState(): boolean {
      if (lastCountFetch === null) {
        return true;
      } else {
        let invokedAt = lastCountFetch.getTime();
        let messageTime = message.createdAt.getTime();
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

    function sendMessage(data: LeaderboardEntry[]) {
      let response = constructEmbed(data);
      message.channel.send(response);
    }

    let isCacheStale = determineCacheState();
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
      sendMessage(leaderboard);
    } else {
      console.log("Retrieving cached leaderboard!");
      sendMessage(cachedLeaderboard);
    }
  }
});

client.login(process.env.TOKEN);
