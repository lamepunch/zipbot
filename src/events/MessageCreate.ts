import { ChannelType, Message } from "discord.js";

import { formatError } from "../utils/helpers.js";

import type { Word } from "../generated/prisma/client.js";

import prisma from "../prisma.js";
import log from "../logger.js";
import commands from "../commands/index.js";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

type ActiveWord = { word: Word; pattern: RegExp };
let cache = new Map<string, { entries: ActiveWord[]; cachedAt: number }>();

async function getActiveWords(snowflakeId: string): Promise<ActiveWord[]> {
  let cached = cache.get(snowflakeId);
  if (cached && Date.now() - cached.cachedAt < FIVE_MINUTES_IN_MS) {
    return cached.entries;
  }

  let words = await prisma.word.findMany({
    where: {
      isActive: true,
      guild: { snowflakeId },
    },
  });

  let entries: ActiveWord[] = [];
  for (let word of words) {
    try {
      entries.push({ word, pattern: new RegExp(word.regex, "gi") });
    } catch (error) {
      log.error(
        { error: formatError(error), wordId: word.id, regex: word.regex },
        "Invalid regex stored for word",
      );
    }
  }
  cache.set(snowflakeId, { entries, cachedAt: Date.now() });
  return entries;
}

export default async function messageCreate(message: Message) {
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
    let words = await getActiveWords(guild.id);

    let matchedWords: { word: Word; count: number }[] = [];
    for (let { word, pattern } of words) {
      let count = (content.match(pattern) ?? []).length;
      if (count > 0) {
        matchedWords.push({ word, count });
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
}
