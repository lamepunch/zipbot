import fs from "fs";

import {
  Client,
  Collection,
  Guild,
  MessageEmbed,
  Message,
  Intents,
  MessageOptions,
} from "discord.js";

import prisma from "./prisma";
import { Server } from "@prisma/client";

import leaderboard from "./commands/leaderboard";
import reactions from "./reactions";

let client: Client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
//@ts-ignore
client.commands = new Collection();
//@ts-ignore
client.commands.set("leaderboard", leaderboard);

// let commandFiles = fs
//   .readdirSync("./commands")
//   .filter((file) => file.endsWith(".js"));

// commandFiles.forEach((file) => {
//   let command = require(`./commands/${file}`);
//   //@ts-ignore
//   client.commands.set(command.data.name, command);
// });

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

client.on("messageCreate", async (message: Message) => {
  let isValidMessage: boolean =
    message.content.match(/unzip/i) !== null &&
    message.author.bot === false &&
    message.channel.type === "GUILD_TEXT" &&
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

      let messageReply: MessageOptions = {
        embeds: [
          {
            image: { url: randomImage },
            footer: { text: "#" + invocationCount },
            color: "#bf40bf",
          },
        ],
      };

      // TODO: Replace this with `message.reply`
      message.reply(messageReply);
    }
  }
});

client.login(process.env.TOKEN);
