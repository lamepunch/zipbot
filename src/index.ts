import {
  Client,
  Collection,
  Guild,
  Message,
  GatewayIntentBits,
  ChannelType,
  MessageFlags,
} from "discord.js";
import { Guild as Server } from "./generated/prisma/client.js";

import { Command } from "./types.js";
import prisma from "./prisma.js";
import log from "./logger.js";

import ReactCommand from "./commands/react.js";
import LeaderboardCommand from "./commands/leaderboard.js";
import QuoteCommand from "./commands/quote.js";
import HighlightCommand from "./commands/highlight.js";

let client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let commands = new Collection<string, Command<any>>();
commands.set("react", ReactCommand);
commands.set("leaderboard", LeaderboardCommand);
commands.set("quote", QuoteCommand);
commands.set("highlight", HighlightCommand);

client.on("guildCreate", async (guild: Guild) => {
  log.debug("guildCreate event fired");

  // Whenever Zipbot joins a new guild, create a new Guild entry in the database
  let { id, name } = guild;
  // @TODO: Make this an upsert instead of a create
  let createGuild: Server = await prisma.guild.create({
    data: {
      snowflakeId: id,
      name,
    },
  });
  // @TODO: Add a check to see if the guild was created, if not inform the bot administrator
});

client.on("messageCreate", async (message: Message) => {
  let { content, author, channel, guild } = message;

  log.debug({ content }, "messageCreate event fired");

  let isZippable: boolean =
    content.match(/unzip/i) !== null &&
    !author.bot &&
    channel.type === ChannelType.GuildText &&
    guild !== null;

  if (isZippable) {
    log.info("Message content matched react criteria");
    let react = commands.get("react");
    if (react) {
      await react.execute(message);
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  log.debug("interactionCreate event fired");

  if (
    interaction.isChatInputCommand() ||
    interaction.isMessageContextMenuCommand()
  ) {
    let { commandName } = interaction;
    let command = commands.get(commandName.toLowerCase());

    if (command) {
      log.info(`Executing ${command} command`);
      await command.execute(interaction);
    } else {
      await interaction.reply({
        content: "Command was unable to be executed. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.on("clientReady", async (client) => {
  log.debug("clientReady event fired");

  log.info(
    client.user,
    `Successfully authenticated as ${client.user.displayName}`,
  );
});

client.login(process.env.TOKEN);
