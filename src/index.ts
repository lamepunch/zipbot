import { Client, Collection, Guild, Message, Intents } from "discord.js";
import { Guild as Server } from "@prisma/client";

import { Command } from "./types";
import prisma from "./prisma";

import ReactCommand from "./commands/react";
import LeaderboardCommand from "./commands/leaderboard";

let client: Client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

let commands = new Collection<string, Command>();
commands.set("react", ReactCommand);
commands.set("leaderboard", LeaderboardCommand);

client.on("guildCreate", async (guild: Guild) => {
  // Whenever Zipbot joins a new guild, create a new Guild entry in the database
  let { id, name } = guild;
  let createGuild: Server = await prisma.guild.create({
    data: {
      id,
      name,
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
    let react = commands.get("react");
    if (react) {
      await react.execute(message);
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() || !interaction.isContextMenu()) return;
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
