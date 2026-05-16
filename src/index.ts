import {
  Client,
  Events,
  Guild,
  Message,
  GatewayIntentBits,
  ChannelType,
  MessageFlags,
} from "discord.js";

import type { Guild as Server } from "./generated/prisma/client.js";
import type { Command } from "./types.js";

import { formatError } from "./utils/helpers.js";

import prisma from "./prisma.js";
import log from "./logger.js";

import ReactCommand from "./commands/react.js";
import LeaderboardCommand from "./commands/leaderboard.js";
import QuoteCommand from "./commands/quote.js";
import HighlightCommand from "./commands/highlight.js";
import EchoCommand from "./commands/echo.js";

let client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let commands = new Map<string, Command<any>>();
commands.set("react", ReactCommand);
commands.set("leaderboard", LeaderboardCommand);
commands.set("quote", QuoteCommand);
commands.set("highlight", HighlightCommand);
commands.set("echo", EchoCommand);

client.on(Events.GuildCreate, async (guild: Guild) => {
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

client.on(Events.MessageCreate, async (message: Message) => {
  let { content, author, channel, guild } = message;

  log.debug(
    {
      id: message.id,
      author: author.username,
      channel: channel.id,
      content: { body: content, embeds: message.embeds },
    },
    "messageCreate event fired",
  );

  let isZippable: boolean =
    content.match(/unzip/i) !== null &&
    !author.bot &&
    channel.type === ChannelType.GuildText &&
    guild !== null;

  if (isZippable) {
    log.info("Message content matched react criteria");

    let react = commands.get("react");
    if (react) {
      try {
        await react.execute(message);
      } catch (error) {
        log.error(
          { error: formatError(error) },
          "Error executing react command",
        );
      }
    } else {
      log.error(commands, "No react command found");
    }
  }

  // Check to see if message content matches any active tracked words
  if (!author.bot && channel.type === ChannelType.GuildText && guild !== null) {
    // @TODO: Should this value be cached?
    let words = await prisma.word.findMany({
      where: {
        isActive: true,
        guild: { snowflakeId: guild.id },
      },
    });

    let matchedWords: { word: (typeof words)[number]; count: number }[] = [];
    for (let word of words) {
      try {
        let pattern = new RegExp(word.regex, "gi");
        let count = [...content.matchAll(pattern)].length;
        if (count > 0) {
          matchedWords.push({ word, count });
        }
      } catch (error) {
        log.error(
          { error: formatError(error), wordId: word.id, regex: word.regex },
          "Invalid regex stored for word",
        );
      }
    }

    if (matchedWords.length > 0) {
      log.info(
        { count: matchedWords.length, messageId: message.id },
        "Recording word occurrences",
      );

      try {
        await prisma.$transaction(
          matchedWords.map(({ word, count }) =>
            prisma.occurrence.create({
              data: {
                count: count > 1 ? count : null,
                word: { connect: { id: word.id } },
                guild: { connect: { id: word.guildId } },
                user: {
                  connectOrCreate: {
                    create: {
                      snowflakeId: author.id,
                      username: author.username,
                      displayName: author.displayName,
                    },
                    where: { snowflakeId: author.id },
                  },
                },
                messageId: message.id,
              },
            }),
          ),
        );
      } catch (error) {
        log.error(
          { error: formatError(error) },
          "Error recording word occurrences",
        );
      }
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  log.debug("interactionCreate event fired");

  if (
    interaction.isChatInputCommand() ||
    interaction.isMessageContextMenuCommand()
  ) {
    let { commandName } = interaction;
    let command = commands.get(commandName.toLowerCase());

    if (command) {
      let { name } = command.data;

      log.info(`Executing ${name} command`);

      try {
        await command.execute(interaction);
      } catch (error) {
        log.error(
          { error: formatError(error) },
          `Error executing ${name} command`,
        );

        await interaction.reply({
          content: "Command was unable to be executed. Please try again later.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } else {
      log.error(command, "Command was unable to be executed");

      await interaction.reply({
        content: "Command was unable to be executed. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.on(Events.ClientReady, async (client) => {
  log.debug("clientReady event fired");

  log.info(
    client.user,
    `Successfully authenticated as ${client.user.displayName}`,
  );
});

try {
  await client.login(process.env.TOKEN);
} catch (error) {
  log.error(error, "Discord client error during login");
}
