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

client.on("guildCreate", async (guild: Guild) => {
  // Whenever Zipbot joins a new guild, create a new Guild entry in the database
  let { id, name } = guild;
  // @TODO: Make this an upsert instead of a create
  let createGuild: Server = await prisma.guild.create({
    data: {
      id,
      name,
    },
  });
  // @TODO: Add a check to see if the guild was created, if not inform the bot administrator
});

client.on("messageCreate", async (message: Message) => {
  let isZippable: boolean =
    message.content.match(/unzip/i) !== null &&
    !message.author.bot &&
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
  if (interaction.isCommand() || interaction.isContextMenu()) {
    let { commandName } = interaction;
    let command = commands.get(commandName.toLowerCase());

    if (command) {
      await command.execute(interaction);
    } else {
      await interaction.reply({
        content: "Command was unable to be executed. Please try again later.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.TOKEN);
