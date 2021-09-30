import { Client, Collection, Guild, Message, Intents } from "discord.js";
import { Guild as Server } from "@prisma/client";

import { Command } from "./types";
import prisma from "./prisma";

import ReactCommand from "./commands/react";
import LeaderboardCommand from "./commands/leaderboard";
import QuoteCommand from "./commands/quote";
import HighlightCommand from "./commands/highlight";

let client: Client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

let commands = new Collection<string, Command<any>>();
commands.set("react", ReactCommand);
commands.set("leaderboard", LeaderboardCommand);
commands.set("quote", QuoteCommand);
commands.set("highlight", HighlightCommand);

console.table(commands);

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
  let { commandName } = interaction;
  let command = commands.get(commandName.toLowerCase());
  if (command) {
    console.log("Executing command " + commandName);
    await command.execute(interaction);
  } else {
    await interaction.reply({
      content: "Command was unable to be executed. Please try again later.",
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);
