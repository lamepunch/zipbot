import { access, readdir } from "node:fs/promises";
import { join } from "node:path";

import prisma from "../src/prisma.js";

// @TODO: Could get this value from R2
const IMAGE_COUNT = 54;

// Run every extension's seed.ts after the core data is in place
async function seedExtensions() {
  const DIR = join(import.meta.dir, "../extensions");

  let entries;
  try {
    entries = await readdir(DIR, { withFileTypes: true });
  } catch {
    return;
  }

  for (let entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }

    let path = join(DIR, entry.name, "seed.ts");
    try {
      await access(path);
    } catch {
      continue;
    }

    console.log(`Running ${entry.name} extension seed`);
    let seed = (await import(path)).default;
    await seed();
  }
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
  } else {
    console.log("Images already exist, skipping creation");
  }

  await seedExtensions();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
