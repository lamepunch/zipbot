import { Message } from "discord.js";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

import { formatError } from "../utils/helpers.js";

import type { Word } from "../generated/prisma/client.js";

import prisma from "../prisma.js";
import log from "../logger.js";

const { NODE_ENV } = process.env;
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// A word is either an obscenity (name is a dataset word, no regex) or a custom regex
type ActiveWord = { word: Word; pattern: RegExp | null; termIds: number[] };
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
    if (word.regex === null) {
      let termIds =
        word.name === null
          ? []
          : matcher.getAllMatches(word.name).map(({ termId }) => termId);

      if (termIds.length === 0) {
        log.error(
          { wordId: word.id, name: word.name },
          "Word name is not a recognized obscenity",
        );
        continue;
      }

      entries.push({ word, pattern: null, termIds });
      continue;
    }

    try {
      entries.push({ word, pattern: new RegExp(word.regex, "gi"), termIds: [] });
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

  let found = matcher.getAllMatches(content);

  let matchedWords: { word: Word; count: number }[] = [];
  for (let { word, pattern, termIds } of words) {
    if (pattern !== null) {
      continue;
    }

    // A word can have several dataset patterns matching the same span, so count distinct spans
    let count = new Set(
      found
        .filter(({ termId }) => termIds.includes(termId))
        .map(({ startIndex }) => startIndex),
    ).size;
    if (count > 0) {
      matchedWords.push({ word, count });
    }
  }

  for (let { word, pattern } of words) {
    if (pattern === null) {
      continue;
    }

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
