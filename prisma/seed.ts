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

  // Create the 3 categories if they don't exist
  await prisma.category.createMany({
    data: [
      { name: "Unzips", objectType: "IMAGE" },
      { name: "Obscenities", objectType: "WORD" },
      { name: "Slurs", objectType: "WORD" },
    ],
    skipDuplicates: true,
  });

  // Get the categories by name
  let categories = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.name.toLowerCase(), c]),
  );

  // Fill the default category with images if it has none
  let images = await prisma.image.count();
  if (images === 0) {
    await prisma.image.createMany({
      data: Array.from({ length: IMAGE_COUNT }, () => ({
        categoryId: categories["unzips"].id,
      })),
    });
  } else {
    console.log("Images already exist, skipping creation");
  }

  // Track every obscenity-dataset word globally, categorizing the slurs, if not already done
  let existingWords = await prisma.word.count({
    where: {
      categoryId: {
        in: [categories["slurs"].id, categories["obscenities"].id],
      },
    },
  });
  if (existingWords === 0) {
    await prisma.word.createMany({
      data: [...getProfanities()].map((name) => ({
        name,
        categoryId: SLURS.includes(name)
          ? categories["slurs"].id
          : categories["obscenities"].id,
      })),
    });
  } else {
    console.log("Words already exist, skipping creation");
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
