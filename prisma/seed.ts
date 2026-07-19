import { englishDataset, type EnglishProfaneWord } from "obscenity";

import prisma from "../src/prisma.js";

// @TODO: Could get this value from R2
const IMAGE_COUNT = 54;

const SLURS: EnglishProfaneWord[] = [
  "abeed",
  "abo",
  "africoon",
  "arabush",
  "boonga",
  "chingchong",
  "chink",
  "dyke",
  "fag",
  "kike",
  "negro",
  "nigger",
  "retard",
  "spastic",
  "tranny",
];

// Collect every word in the obscenity english dataset
function getProfanities(): Set<EnglishProfaneWord> {
  let profanities = new Set<EnglishProfaneWord>();

  for (let { id } of englishDataset.build().blacklistedTerms) {
    let { phraseMetadata } = englishDataset.getPayloadWithPhraseMetadata({
      termId: id,
      startIndex: 0,
      endIndex: 0,
      matchLength: 0,
    });

    if (phraseMetadata) {
      profanities.add(phraseMetadata.originalWord);
    }
  }

  return profanities;
}

async function main() {
  // Add the main test server that Zipbot is always in
  let testServer = await prisma.guild.upsert({
    where: { snowflakeId: "829607606867066911" },
    update: {},
    create: {
      snowflakeId: "829607606867066911",
      name: "Lamepunch",
    },
  });

  // Add the react command
  let reactCommand = await prisma.command.upsert({
    where: { name: "react" },
    update: {},
    create: {
      name: "react",
      description: "React to a message with a random image.",
    },
  });

  // Add the default reaction category
  let unzipCategory = await prisma.category.upsert({
    where: { name_objectType: { name: "Unzips", objectType: "IMAGE" } },
    update: {},
    create: {
      name: "Unzips",
      objectType: "IMAGE",
    },
  });

  // Fill the default category with images if it has none
  let images = await prisma.image.count();
  if (images === 0) {
    await prisma.image.createMany({
      data: Array.from({ length: IMAGE_COUNT }, () => ({
        categoryId: unzipCategory.id,
      })),
    });
  }

  // Add the categories that classify tracked words
  let slurCategory = await prisma.category.upsert({
    where: { name_objectType: { name: "Slurs", objectType: "WORD" } },
    update: {},
    create: {
      name: "Slurs",
      objectType: "WORD",
    },
  });

  let obscenityCategory = await prisma.category.upsert({
    where: { name_objectType: { name: "Obscenities", objectType: "WORD" } },
    update: {},
    create: {
      name: "Obscenities",
      objectType: "WORD",
    },
  });

  // Track every obscenity-dataset word, categorizing the slurs
  for (let name of getProfanities()) {
    let categoryId = SLURS.includes(name)
      ? slurCategory.id
      : obscenityCategory.id;

    await prisma.word.upsert({
      where: { guildId_name: { guildId: testServer.id, name } },
      update: { categoryId },
      create: {
        name,
        guildId: testServer.id,
        categoryId,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
