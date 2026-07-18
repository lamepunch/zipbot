import prisma from "../src/prisma";

// @TODO: Could get this value from R2
const IMAGE_COUNT = 54;

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
    where: { name: "Unzips" },
    update: {},
    create: {
      name: "Unzips",
    },
  });

  // Fill the default category with images if it has none
  let existing = await prisma.image.count();
  if (existing === 0) {
    await prisma.image.createMany({
      data: Array.from({ length: IMAGE_COUNT }, () => ({
        categoryId: unzipCategory.id,
      })),
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
