import { Client, Guild, Message, MessageEmbed } from "discord.js";
import { PrismaClient } from "@prisma/client";

import reactions from "./reactions";

let prisma: PrismaClient = new PrismaClient();
let client: Client = new Client();

let count: number = 0;

client.on("guildCreate", async (guild: Guild) => {
  // Whenever Zipbot joins a new server, create a server
  // entry in the database
  let createServer = await prisma.server.create({
    data: {
      id: guild.id,
      name: guild.name,
    },
  });
});

client.on("message", async (message: Message) => {
  let validMessage =
    message.content.match(/unzip/i) !== null &&
    message.author.bot !== true &&
    message.channel.type === "text" &&
    message.guild !== null;

  if (validMessage) {
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
          connect: { id: message.guild.id },
        },
        channel: {
          connectOrCreate: {
            create: {
              id: message.channel.id,
              name: message.channel.name,
              server: { connect: { id: message.guild.id } },
            },
            where: {
              id: message.channel.id,
            },
          },
        },
      },
    });

    let invocationCount = await prisma.invocation.count({
      where: { serverId: message.guild.id },
    });

    if (createInvocation && invocationCount) {
      let randomImage: string =
        reactions[Math.floor(Math.random() * reactions.length)];

      let response: MessageEmbed = new MessageEmbed()
        .setImage(randomImage)
        .setFooter(`#${invocationCount}`);

      message.channel.send(`${message.author} unzipped:`, response);
    }
  }
});

client.login(process.env.TOKEN);
