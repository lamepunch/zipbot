import { Message } from "discord.js";

import { formatError } from "../utils/helpers.js";

import type { Word } from "../generated/prisma/client.js";

import prisma from "../prisma.js";
import log from "../logger.js";

const { NODE_ENV } = process.env;
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

type ActiveWord = { word: Word; pattern: RegExp };
let cache = new Map<string, { entries: ActiveWord[]; cachedAt: number }>();

async function getActiveWords(snowflakeId: string): Promise<ActiveWord[]> {
  // Skip the cache during development so word changes show up immediately
  if (NODE_ENV !== "development") {
    let cached = cache.get(snowflakeId);
    if (cached && Date.now() - cached.cachedAt < FIVE_MINUTES_IN_MS) {
      return cached.entries;
    }
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

// Record an Occurrence for every active tracked word matching the message
export default async function recordOccurrences(message: Message) {
  let { content, author, guild } = message;
  if (guild === null) {
    return { matched: [], created: [] };
  }

  let words = await getActiveWords(guild.id);

  let matchedWords: { word: Word; count: number }[] = [];
  for (let { word, pattern } of words) {
    let count = (content.match(pattern) ?? []).length;
    if (count > 0) {
      matchedWords.push({ word, count });
    }
  }

  // Only record matched words that don't already have an occurrence for this message
  let created: typeof matchedWords = [];
  if (matchedWords.length > 0) {
    let existing = await prisma.occurrence.findMany({
      where: { messageId: message.id },
      select: { wordId: true },
    });
    let recorded = new Set(existing.map(({ wordId }) => wordId));
    created = matchedWords.filter(({ word }) => !recorded.has(word.id));
  }

  if (created.length > 0) {
    log.info(
      { count: created.length, messageId: message.id },
      "Recording word occurrences",
    );

    try {
      await prisma.$transaction(
        created.map(({ word, count }) =>
          prisma.occurrence.create({
            data: {
              occurredAt: message.createdAt,
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

  return { matched: matchedWords, created };
}
