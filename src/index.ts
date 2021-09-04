import { Client, Collection, Guild, Message, Intents } from "discord.js";
import { Server } from "@prisma/client";

import { Command } from "./types";
import prisma from "./prisma";

import ReactCommand from "./commands/react";
import LeaderboardCommand from "./commands/leaderboard";

let client: Client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

let commands = new Collection<string, Command>();
commands.set("leaderboard", LeaderboardCommand);

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
  let isZippable: boolean =
    message.content.match(/unzip/i) !== null &&
    message.author.bot === false &&
    message.channel.type === "GUILD_TEXT" &&
    message.guild !== null;

  if (isZippable) {
    ReactCommand(message);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  let command = commands.get(interaction.commandName);

  try {
    if (command) {
      await command.execute(interaction);
    } else {
      throw new Error("Command not found");
    }
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content:
        "There was an error executing your command. Please try again later.",
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);
