import prisma from "../src/prisma";

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
